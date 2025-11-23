const express = require('express');
const router = express.Router();
const { register, login, getProfile, uploadProfileImage, verifyToken, adminGetAllUsers, adminGetUserDetails, adminDeleteUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');

// POST /api/auth/register - Бүртгэл
router.post('/register', validateRegistration, register);

// POST /api/auth/login - Нэвтрэх
router.post('/login', validateLogin, login);

// GET /api/auth/profile - Өөрийн мэдээлэл авах (хамгаалагдсан)
router.get('/profile', authenticateToken, getProfile);

// POST /api/auth/profile/image - Профайл зураг оруулах (хамгаалагдсан)
router.post('/profile/image', authenticateToken, uploadProfileImage);

// GET /api/auth/verify - Token шалгах (хамгаалагдсан)
router.get('/verify', authenticateToken, verifyToken);

// GET /api/auth/admin/users - Бүх хэрэглэгчид (Admin)
router.get('/admin/users', authenticateToken, requireAdmin, adminGetAllUsers);

// GET /api/auth/admin/users/:id - Нэг хэрэглэгчийн дэлгэрэнгүй мэдээлэл (Admin - ID зургуудтай)
router.get('/admin/users/:id', authenticateToken, requireAdmin, adminGetUserDetails);

// DELETE /api/auth/admin/users/:id - Хэрэглэгч устгах (Admin)
router.delete('/admin/users/:id', authenticateToken, requireAdmin, adminDeleteUser);

module.exports = router;
