const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyToken } = require('../controllers/authController');
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

module.exports = router;
