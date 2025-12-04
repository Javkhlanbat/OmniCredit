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

    // Funnel steps тодорхойлох
    const funnelSteps = [
      { step: 'home', name: 'Нүүр хуудас', url: '/' },
      { step: 'register_page', name: 'Бүртгэл', url: '/register' },
      { step: 'register_complete', name: 'Бүртгэл дууссан', eventType: 'form_submit' },
      { step: 'loan_calculator', name: 'Зээлийн тооцоолуур', url: '/zeelhuudas' },
      { step: 'loan_application', name: 'Зээлийн хүсэлт', url: '/application' }
    ];

    const result = await pool.query(`
      WITH step_counts AS (
        SELECT
          CASE
            WHEN url = '/' THEN 'home'
            WHEN url = '/register' THEN 'register_page'
            WHEN url = '/zeelhuudas' THEN 'loan_calculator'
            WHEN url = '/application' OR url = '/application-new' THEN 'loan_application'
            WHEN event_type = 'form_submit' AND url = '/register' THEN 'register_complete'
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
          WHEN 'loan_application' THEN 5
        END
    `);

    // Friction points олох
    const frictionQuery = await pool.query(`
      SELECT
        url,
        device_type,
        COUNT(*) as error_count,
        AVG(CASE WHEN event_type = 'scroll' THEN (event_data->>'scrollPercent')::int ELSE NULL END) as avg_scroll,
        COUNT(CASE WHEN event_type = 'form_error' THEN 1 END) as form_errors,
        AVG(CASE WHEN event_type = 'page_exit' THEN (event_data->>'dwellTime')::int ELSE NULL END) as avg_dwell_time
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND url IN ('/register', '/application', '/zeelhuudas')
      GROUP BY url, device_type
      ORDER BY form_errors DESC, avg_dwell_time DESC
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
