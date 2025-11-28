const jwt = require('jsonwebtoken');

// JWT token шалгах middleware
const authenticateToken = (req, res, next) => {
  try {
    // Header-ээс token авах
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Нэвтрэх шаардлагатай',
        message: 'Token олдсонгүй'
      });
    }

    // Token баталгаажуулах
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          error: 'Хүчингүй token',
          message: 'Token хүчинтэй биш эсвэл хугацаа дууссан'
        });
      }

      // User мэдээллийг request-д хадгалах
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
