const express = require('express');
const router = express.Router();
const {
  // Company Admin
  adminCreateCompany,
  adminGetAllCompanies,
  adminGetCompanyDetails,
  adminUpdateCompany,
  adminDeleteCompany,

  // Promo Code Admin
  adminCreatePromoCode,
  adminGetAllPromoCodes,
  adminGetPromoCodeDetails,
  adminUpdatePromoCode,
  adminDeletePromoCode,

  // User
  verifyPromoCode
} = require('../controllers/promoCodeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// ==========================================
// ХЭРЭГЛЭГЧИЙН ROUTES (Public - authenticated)
// ==========================================

// POST /api/promo/verify - Код шалгах
router.post('/verify', authenticateToken, verifyPromoCode);

// ==========================================
// ADMIN ROUTES - КОМПАНИ
// ==========================================

// POST /api/promo/admin/companies - Компани үүсгэх
router.post('/admin/companies', authenticateToken, requireAdmin, adminCreateCompany);

// GET /api/promo/admin/companies - Бүх компаниуд
router.get('/admin/companies', authenticateToken, requireAdmin, adminGetAllCompanies);

// GET /api/promo/admin/companies/:id - Компани дэлгэрэнгүй
router.get('/admin/companies/:id', authenticateToken, requireAdmin, adminGetCompanyDetails);

// PUT /api/promo/admin/companies/:id - Компани шинэчлэх
router.put('/admin/companies/:id', authenticateToken, requireAdmin, adminUpdateCompany);

// DELETE /api/promo/admin/companies/:id - Компани устгах
router.delete('/admin/companies/:id', authenticateToken, requireAdmin, adminDeleteCompany);

// ==========================================
// ADMIN ROUTES - НЭМЭГДЛИЙН КОД
// ==========================================

// POST /api/promo/admin/codes - Код үүсгэх
router.post('/admin/codes', authenticateToken, requireAdmin, adminCreatePromoCode);

// GET /api/promo/admin/codes - Бүх кодууд
router.get('/admin/codes', authenticateToken, requireAdmin, adminGetAllPromoCodes);

// GET /api/promo/admin/codes/:id - Код дэлгэрэнгүй
router.get('/admin/codes/:id', authenticateToken, requireAdmin, adminGetPromoCodeDetails);

// PUT /api/promo/admin/codes/:id - Код шинэчлэх
router.put('/admin/codes/:id', authenticateToken, requireAdmin, adminUpdatePromoCode);

// DELETE /api/promo/admin/codes/:id - Код устгах
router.delete('/admin/codes/:id', authenticateToken, requireAdmin, adminDeletePromoCode);

module.exports = router;
