const express = require('express');
const router = express.Router();
const {
  makePayment,
  getLoanPayments,
  getMyPayments,
  getPaymentDetails,
  getMyPaymentStats,
  checkLoanBalance,
  adminGetAllPayments
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validatePayment } = require('../middleware/validationMiddleware');

// POST /api/payments - Төлбөр хийх (хамгаалагдсан)
router.post('/', authenticateToken, validatePayment, makePayment);

// GET /api/payments/my - Өөрийн бүх төлбөрүүд (хамгаалагдсан)
router.get('/my', authenticateToken, getMyPayments);

// GET /api/payments/stats - Төлбөрийн статистик (хамгаалагдсан)
router.get('/stats', authenticateToken, getMyPaymentStats);

// GET /api/payments/loan/:loanId - Зээлийн төлбөрүүд (хамгаалагдсан)
router.get('/loan/:loanId', authenticateToken, getLoanPayments);

// GET /api/payments/loan/:loanId/balance - Зээлийн үлдэгдэл (хамгаалагдсан)
router.get('/loan/:loanId/balance', authenticateToken, checkLoanBalance);

// GET /api/payments/:id - Төлбөрийн дэлгэрэнгүй (хамгаалагдсан)
router.get('/:id', authenticateToken, getPaymentDetails);

// Admin routes
// GET /api/payments/admin/all - Бүх төлбөрүүд
router.get('/admin/all', authenticateToken, adminGetAllPayments);

module.exports = router;
