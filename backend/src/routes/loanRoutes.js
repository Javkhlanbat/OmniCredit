const express = require('express');
const router = express.Router();
const {
  applyForLoan,
  getMyLoans,
  getLoanDetails,
  getMyLoanStats,
  applyForPurchaseLoan,
  getMyPurchaseLoans,
  adminGetAllLoans,
  adminUpdateLoanStatus,
  adminDisburseLoan
} = require('../controllers/loanController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { validateLoanApplication } = require('../middleware/validationMiddleware');

// POST /api/loans/apply - Зээл хүсэлт илгээх (хамгаалагдсан)
router.post('/apply', authenticateToken, validateLoanApplication, applyForLoan);

// GET /api/loans/my - Өөрийн зээлүүд (хамгаалагдсан)
router.get('/my', authenticateToken, getMyLoans);

// GET /api/loans/stats - Өөрийн зээлийн статистик (хамгаалагдсан)
router.get('/stats', authenticateToken, getMyLoanStats);

// POST /api/loans/purchase - Худалдан авалтын зээл (0% хүү) (хамгаалагдсан)
router.post('/purchase', authenticateToken, applyForPurchaseLoan);

// GET /api/loans/purchase/my - Өөрийн purchase loans (хамгаалагдсан)
router.get('/purchase/my', authenticateToken, getMyPurchaseLoans);

// Admin routes - specific routes BEFORE :id parameter routes
// GET /api/loans/admin/all - Бүх зээлүүд
router.get('/admin/all', authenticateToken, requireAdmin, adminGetAllLoans);

// PUT /api/loans/admin/:id/status - Зээлийн статус өөрчлөх
router.put('/admin/:id/status', authenticateToken, requireAdmin, adminUpdateLoanStatus);

// POST /api/loans/admin/:id/disburse - Зээл олгох (approved -> disbursed)
router.post('/admin/:id/disburse', authenticateToken, requireAdmin, adminDisburseLoan);

// GET /api/loans/:id - Зээлийн дэлгэрэнгүй (must be LAST to avoid conflict)
router.get('/:id', authenticateToken, getLoanDetails);

module.exports = router;
