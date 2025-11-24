const express = require('express');
const router = express.Router();
const {
  getMyWallet,
  getMyTransactions,
  withdrawToBankAccount,
  payLoanFromWallet
} = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/wallet - Өөрийн wallet авах
router.get('/', authenticateToken, getMyWallet);

// GET /api/wallet/transactions - Гүйлгээний түүх
router.get('/transactions', authenticateToken, getMyTransactions);

// POST /api/wallet/withdraw - Банк руу шилжүүлэх
router.post('/withdraw', authenticateToken, withdrawToBankAccount);

// POST /api/wallet/pay-loan - Wallet-ээс зээл төлөх
router.post('/pay-loan', authenticateToken, payLoanFromWallet);

module.exports = router;
