const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyToken, adminGetAllUsers } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');

// POST /api/auth/register - Бүртгэл
router.post('/register', validateRegistration, register);

// POST /api/auth/login - Нэвтрэх
router.post('/login', validateLogin, login);

// GET /api/auth/profile - Өөрийн мэдээлэл авах (хамгаалагдсан)
router.get('/profile', authenticateToken, getProfile);

// GET /api/auth/verify - Token шалгах (хамгаалагдсан)
router.get('/verify', authenticateToken, verifyToken);

// GET /api/auth/admin/users - Бүх хэрэглэгчид (Admin)
router.get('/admin/users', authenticateToken, adminGetAllUsers);

module.exports = router;
