const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

// Optional auth - tracks both logged-in and anonymous users
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Continue without user
    }
  }
  next();
};

// Start new session
router.post('/session/start', async (req, res) => {
  try {
    const { sessionId, deviceInfo, referrer } = req.body;

    await pool.query(
      `INSERT INTO user_sessions (session_id, device_info, started_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (session_id) DO NOTHING`,
      [sessionId, JSON.stringify(deviceInfo)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Track activity
router.post('/activity', optionalAuth, async (req, res) => {
  try {
    const { sessionId, actionType, page_url, page_title, time_spent, deviceInfo, referrer } = req.body;
    const userId = req.user?.userId || null;

    // Insert activity
    await pool.query(
      `INSERT INTO user_activities
       (user_id, session_id, page_url, page_title, action_type, time_spent, device_info, referrer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, sessionId, page_url, page_title, actionType, time_spent || 0, JSON.stringify(deviceInfo), referrer]
    );

    // Update session
    await pool.query(
      `UPDATE user_sessions
       SET user_id = COALESCE(user_id, $1),
           pages_visited = pages_visited + 1,
           ended_at = NOW(),
           total_duration = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
           exit_page = $2
       WHERE session_id = $3`,
      [userId, page_url, sessionId]
    );

    // Check if user converted (submitted loan application)
    if (actionType === 'loan_application') {
      await pool.query(
        `UPDATE user_sessions SET converted = TRUE WHERE session_id = $1`,
        [sessionId]
      );

      if (userId) {
        await pool.query(
          `UPDATE users
           SET loan_conversion_count = loan_conversion_count + 1
           WHERE id = $1`,
          [userId]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({ error: 'Failed to track activity' });
  }
});

// Get funnel data for admin dashboard
router.get('/funnel', authenticateToken, async (req, res) => {
  try {
    // Get funnel metrics for last 30 days
    const funnelData = await pool.query(`
      WITH funnel_stages AS (
        SELECT
          COUNT(DISTINCT CASE WHEN page_url = '/' THEN session_id END) as homepage_visits,
          COUNT(DISTINCT CASE WHEN page_url LIKE '%/loan%' OR page_url LIKE '%application%' THEN session_id END) as loan_page_visits,
          COUNT(DISTINCT CASE WHEN page_url LIKE '%/calculator%' OR page_url LIKE '%zeelhuudas%' THEN session_id END) as calculator_visits,
          COUNT(DISTINCT CASE WHEN action_type = 'loan_application' THEN session_id END) as loan_applications
        FROM user_activities
        WHERE created_at >= NOW() - INTERVAL '30 days'
      )
      SELECT * FROM funnel_stages
    `);

    const funnel = funnelData.rows[0];

    res.json({
      stages: [
        { name: 'Нүүр хуудас', value: parseInt(funnel.homepage_visits) || 0, color: '#26D0CE' },
        { name: 'Зээлийн хуудас', value: parseInt(funnel.loan_page_visits) || 0, color: '#26D0CE' },
        { name: 'Тооцоолуур', value: parseInt(funnel.calculator_visits) || 0, color: '#FFA726' },
        { name: 'Зээл авсан', value: parseInt(funnel.loan_applications) || 0, color: '#A726FF' }
      ]
    });
  } catch (error) {
    console.error('Funnel data error:', error);
    res.status(500).json({ error: 'Failed to get funnel data' });
  }
});

// Get bounce rate and critical warnings
router.get('/bounce-rate', authenticateToken, async (req, res) => {
  try {
    const bounceData = await pool.query(`
      WITH bounce_analysis AS (
        SELECT
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN pages_visited = 1 AND total_duration < 30 THEN 1 END) as bounced_sessions,
          AVG(CASE WHEN pages_visited = 1 AND total_duration < 30 THEN 1 ELSE 0 END) * 100 as bounce_rate,
          COUNT(CASE WHEN device_info->>'browser' = 'Chrome' AND pages_visited = 1 AND total_duration < 30 THEN 1 END) as chrome_bounces,
          COUNT(CASE WHEN device_info->>'deviceType' = 'mobile' AND pages_visited = 1 AND total_duration < 30 THEN 1 END) as mobile_bounces
        FROM user_sessions
        WHERE started_at >= NOW() - INTERVAL '30 days'
      )
      SELECT
        bounce_rate,
        bounced_sessions,
        total_sessions,
        ROUND((chrome_bounces::DECIMAL / NULLIF(bounced_sessions, 0) * 100), 1) as chrome_bounce_percent,
        ROUND((mobile_bounces::DECIMAL / NULLIF(bounced_sessions, 0) * 100), 1) as mobile_bounce_percent
      FROM bounce_analysis
    `);

    const data = bounceData.rows[0];

    res.json({
      bounceRate: parseFloat(data.bounce_rate) || 0,
      bouncedSessions: parseInt(data.bounced_sessions) || 0,
      totalSessions: parseInt(data.total_sessions) || 0,
      chromeBouncePercent: parseFloat(data.chrome_bounce_percent) || 0,
      mobileBouncePercent: parseFloat(data.mobile_bounce_percent) || 0
    });
  } catch (error) {
    console.error('Bounce rate error:', error);
    res.status(500).json({ error: 'Failed to get bounce rate' });
  }
});

// Get user behavior predictions
router.get('/predictions', authenticateToken, async (req, res) => {
  try {
    const predictions = await pool.query(`
      WITH user_behavior AS (
        SELECT
          u.id,
          u.age,
          u.visit_count,
          u.loan_conversion_count,
          COUNT(DISTINCT s.session_id) as total_sessions,
          AVG(s.pages_visited) as avg_pages_per_session,
          AVG(s.total_duration) as avg_session_duration,
          COUNT(DISTINCT CASE WHEN ua.action_type = 'loan_application' THEN ua.session_id END) as loan_attempts
        FROM users u
        LEFT JOIN user_sessions s ON u.id = s.user_id
        LEFT JOIN user_activities ua ON u.id = ua.user_id
        WHERE u.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY u.id, u.age, u.visit_count, u.loan_conversion_count
      )
      SELECT
        age,
        total_sessions,
        loan_conversion_count,
        CASE
          WHEN total_sessions = 0 THEN 0
          WHEN loan_conversion_count::DECIMAL / total_sessions >= 0.5 THEN 0.8
          WHEN loan_conversion_count::DECIMAL / total_sessions >= 0.2 THEN 0.5
          ELSE 0.2
        END as conversion_probability,
        avg_pages_per_session,
        avg_session_duration
      FROM user_behavior
      WHERE total_sessions > 0
      ORDER BY total_sessions DESC
      LIMIT 100
    `);

    res.json({ predictions: predictions.rows });
  } catch (error) {
    console.error('Predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

// Get summary stats for admin dashboard
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summaryData = await pool.query(`
      WITH summary_stats AS (
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(*) as page_views,
          AVG(total_duration) as avg_session_duration_sec
        FROM user_sessions
        WHERE started_at >= NOW() - INTERVAL '30 days'
      )
      SELECT * FROM summary_stats
    `);

    const summary = summaryData.rows[0];

    res.json({
      summary: {
        total_sessions: parseInt(summary.total_sessions) || 0,
        unique_users: parseInt(summary.unique_users) || 0,
        page_views: parseInt(summary.page_views) || 0,
        avg_session_duration_sec: parseFloat(summary.avg_session_duration_sec) || 0
      }
    });
  } catch (error) {
    console.error('Summary stats error:', error);
    res.status(500).json({ error: 'Failed to get summary stats' });
  }
});

// Get page analytics - which pages users spend most time on
router.get('/page-analytics', authenticateToken, async (req, res) => {
  try {
    const pageData = await pool.query(`
      WITH page_stats AS (
        SELECT
          page_url,
          page_title,
          COUNT(*) as total_visits,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
          ROUND(AVG(time_spent)::numeric, 1) as avg_time_spent_seconds,
          SUM(time_spent) as total_time_spent,
          COUNT(*) FILTER (WHERE action_type = 'click') as total_clicks,
          MIN(created_at) as first_visit,
          MAX(created_at) as last_visit
        FROM user_activities
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND page_url IS NOT NULL
          AND page_url != ''
        GROUP BY page_url, page_title
      )
      SELECT
        page_url,
        COALESCE(page_title, page_url) as page_title,
        total_visits,
        unique_sessions,
        unique_users,
        avg_time_spent_seconds,
        total_time_spent,
        total_clicks,
        ROUND((avg_time_spent_seconds / 60.0)::numeric, 2) as avg_time_minutes,
        first_visit,
        last_visit
      FROM page_stats
      ORDER BY total_time_spent DESC, total_visits DESC
      LIMIT 50
    `);

    res.json({
      pages: pageData.rows.map(row => ({
        url: row.page_url,
        title: row.page_title,
        visits: parseInt(row.total_visits),
        uniqueSessions: parseInt(row.unique_sessions),
        uniqueUsers: parseInt(row.unique_users),
        avgTimeSeconds: parseFloat(row.avg_time_spent_seconds) || 0,
        avgTimeMinutes: parseFloat(row.avg_time_minutes) || 0,
        totalTimeSeconds: parseInt(row.total_time_spent) || 0,
        totalClicks: parseInt(row.total_clicks) || 0,
        firstVisit: row.first_visit,
        lastVisit: row.last_visit
      }))
    });
  } catch (error) {
    console.error('Page analytics error:', error);
    res.status(500).json({ error: 'Failed to get page analytics' });
  }
});

module.exports = router;
