const { findUserById } = require('../models/userModel');

// Admin эрх шалгах middleware
const requireAdmin = async (req, res, next) => {
  try {
    // authenticateToken middleware-ээс req.user ирсэн байх ёстой
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Нэвтрэх шаардлагатай',
        message: 'Token олдсонгүй эсвэл хүчингүй'
      });
    }

    // Database-ээс хэрэглэгчийн мэдээлэл авах
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Хэрэглэгч олдсонгүй',
        message: 'Хэрэглэгчийн мэдээлэл олдсонгүй'
      });
    }

    // Admin эрх шалгах
    if (!user.is_admin) {
      return res.status(403).json({
        error: 'Хандах эрхгүй',
        message: 'Зөвхөн admin хэрэглэгч энэ үйлдлийг хийх боломжтой'
      });
    }

    // Admin эрхтэй бол үргэлжлүүлэх
    req.adminUser = user;
    next();

  } catch (error) {
    console.error('Admin middleware алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

module.exports = {
  requireAdmin
};
