const { pool } = require('../config/database');

// Event хадгалах
const saveEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array required' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const event of events) {
        await client.query(`
          INSERT INTO analytics_events (
            event_type, session_id, user_id, url,
            device_type, user_agent, screen_width, screen_height,
            viewport_width, viewport_height, event_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          event.eventType,
          event.sessionId,
          event.userId,
          event.url,
          event.deviceInfo?.deviceType,
          event.deviceInfo?.userAgent,
          event.deviceInfo?.screenWidth,
          event.deviceInfo?.screenHeight,
          event.deviceInfo?.viewportWidth,
          event.deviceInfo?.viewportHeight,
          JSON.stringify(event)
        ]);

        // Update or create funnel session
        await client.query(`
          INSERT INTO funnel_sessions (
            session_id, user_id, device_type, current_step, total_events
          ) VALUES ($1, $2, $3, $4, 1)
          ON CONFLICT (session_id)
          DO UPDATE SET
            total_events = funnel_sessions.total_events + 1,
            current_step = EXCLUDED.current_step,
            ended_at = CURRENT_TIMESTAMP
        `, [
          event.sessionId,
          event.userId,
          event.deviceInfo?.deviceType,
          event.url
        ]);
      }

      await client.query('COMMIT');
      res.json({ success: true, eventsProcessed: events.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving events:', error);
    res.status(500).json({ error: 'Failed to save events' });
  }
};

// Funnel анализ авах (Admin)
const getFunnelAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Funnel steps тодорхойлох - Loan Application Journey
    const funnelSteps = [
      { step: 'home', name: 'Нүүр хуудас', url: '/' },
      { step: 'register_page', name: 'Бүртгэл хуудас', url: '/register' },
      { step: 'register_complete', name: 'Бүртгэл дууссан', eventType: 'form_submit' },
      { step: 'loan_calculator', name: 'Зээлийн тооцоолуур', url: '/zeelhuudas' },
      { step: 'loan_application_page', name: 'Зээлийн хүсэлт хуудас', url: '/application' },
      { step: 'loan_application_started', name: 'Хүсэлт эхэлсэн', eventType: 'loan_application_started' },
      { step: 'loan_application_submit', name: 'Хүсэлт илгээсэн', eventType: 'loan_application_submit_attempt' },
      { step: 'loan_application_completed', name: 'Хүсэлт амжилттай', eventType: 'loan_application_completed' }
    ];

    const result = await pool.query(`
      WITH step_counts AS (
        SELECT
          CASE
            WHEN url = '/' AND event_type = 'page_view' THEN 'home'
            WHEN url = '/register' AND event_type = 'page_view' THEN 'register_page'
            WHEN event_type = 'form_submit' AND url = '/register' THEN 'register_complete'
            WHEN url = '/zeelhuudas' AND event_type = 'page_view' THEN 'loan_calculator'
            WHEN (url = '/application' OR url = '/application-new') AND event_type = 'loan_application_view' THEN 'loan_application_page'
            WHEN event_type = 'loan_application_started' THEN 'loan_application_started'
            WHEN event_type = 'loan_application_submit_attempt' THEN 'loan_application_submit'
            WHEN event_type = 'loan_application_completed' THEN 'loan_application_completed'
          END as step,
          COUNT(DISTINCT session_id) as sessions
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY step
      )
      SELECT * FROM step_counts WHERE step IS NOT NULL
      ORDER BY
        CASE step
          WHEN 'home' THEN 1
          WHEN 'register_page' THEN 2
          WHEN 'register_complete' THEN 3
          WHEN 'loan_calculator' THEN 4
          WHEN 'loan_application_page' THEN 5
          WHEN 'loan_application_started' THEN 6
          WHEN 'loan_application_submit' THEN 7
          WHEN 'loan_application_completed' THEN 8
        END
    `);

    // Friction points олох - Where users are dropping off
    const frictionQuery = await pool.query(`
      SELECT
        url,
        device_type,
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(CASE WHEN event_type = 'scroll' THEN (event_data->>'scrollPercent')::int ELSE NULL END) as avg_scroll,
        COUNT(CASE WHEN event_type = 'form_error' OR event_type = 'loan_application_validation_error' THEN 1 END) as validation_errors,
        COUNT(CASE WHEN event_type = 'loan_application_blocked' THEN 1 END) as blocked_count,
        COUNT(CASE WHEN event_type = 'loan_application_failed' THEN 1 END) as failed_count,
        AVG(CASE WHEN event_type = 'page_exit' THEN (event_data->>'dwellTime')::int ELSE NULL END) as avg_dwell_time
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND (
          url IN ('/register', '/application', '/application-new', '/zeelhuudas')
          OR event_type IN ('loan_application_blocked', 'loan_application_validation_error', 'loan_application_failed')
        )
      GROUP BY url, device_type, event_type
      ORDER BY validation_errors DESC, blocked_count DESC, failed_count DESC
    `);

    res.json({
      funnelSteps: result.rows,
      frictionPoints: frictionQuery.rows
    });
  } catch (error) {
    console.error('Error getting funnel analysis:', error);
    res.status(500).json({ error: 'Failed to get funnel analysis' });
  }
};

// Device breakdown авах
const getDeviceBreakdown = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        device_type,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(CASE WHEN event_type = 'page_exit' THEN 1 END) as exits,
        ROUND(
          COUNT(CASE WHEN event_type = 'page_exit' THEN 1 END)::decimal /
          NULLIF(COUNT(DISTINCT session_id), 0) * 100,
          1
        ) as drop_rate
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND url = '/register'
      GROUP BY device_type
    `);

    res.json({ devices: result.rows });
  } catch (error) {
    console.error('Error getting device breakdown:', error);
    res.status(500).json({ error: 'Failed to get device breakdown' });
  }
};

// Түгээмэл алдаанууд авах
const getCommonErrors = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        event_data->>'errorMessage' as error_message,
        event_data->>'fieldName' as field_name,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'form_error'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY error_message, field_name
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({ errors: result.rows });
  } catch (error) {
    console.error('Error getting common errors:', error);
    res.status(500).json({ error: 'Failed to get common errors' });
  }
};

// Статистик summary
const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await pool.query(`
      SELECT
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_events,
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as page_views,
        AVG(CASE WHEN event_type = 'page_exit' THEN (event_data->>'dwellTime')::int END) / 1000 as avg_session_duration_sec
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    res.json({ summary: summary.rows[0] });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
};

module.exports = {
  saveEvents,
  getFunnelAnalysis,
  getDeviceBreakdown,
  getCommonErrors,
  getAnalyticsSummary
};
