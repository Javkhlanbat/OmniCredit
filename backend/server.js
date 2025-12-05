require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./src/config/init-db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS тохиргоо
const allowedOrigins = [
  'http://localhost:5173',                        // Local development
  'http://localhost:5174',                        // Local development (alt port)
  'https://omnicredit-frontend.onrender.com'      // Production frontend
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy: Origin not allowed';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


initDatabase().catch(console.error);

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const loanRoutes = require('./src/routes/loanRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const promoCodeRoutes = require('./src/routes/promoCodeRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const trackingRoutes = require('./src/routes/tracking');

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'ajilaj baina',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      loans: '/api/loans',
      payments: '/api/payments'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Database test
app.get('/db-test', async (req, res) => {
  res.json({
    message: 'Database holbolt testleh',
    database_url: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/promo', promoCodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tracking', trackingRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Серверт алдаа гарлаа!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server ажиллаж байна: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});
