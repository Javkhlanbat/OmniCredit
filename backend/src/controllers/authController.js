const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserByPhone, verifyPassword, findUserById, getAllUsers, deleteUser } = require('../models/userModel');

// JWT token үүсгэх
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 хоног
  );
};

// Бүртгэл
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, register_number } = req.body;

    // И-мэйл бүртгэлтэй эсэх шалгах
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'И-мэйл бүртгэлтэй байна',
        message: 'Энэ и-мэйл хаягаар аль хэдийн бүртгүүлсэн байна'
      });
    }

    // Хэрэглэгч үүсгэх
    const newUser = await createUser({
      email,
      password,
      first_name,
      last_name,
      phone,
      register_number
    });

    // Token үүсгэх
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Амжилттай бүртгэгдлээ',
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        register_number: newUser.register_number,
        is_admin: newUser.is_admin || false
      },
      token
    });

  } catch (error) {
    console.error('Register алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Нэвтрэх
const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Хэрэглэгч хайх
    let user = null;
    if (email) {
      user = await findUserByEmail(email);
    } else if (phone) {
      user = await findUserByPhone(phone);
    }
    if (!user) {
      return res.status(401).json({
        error: 'Нэвтрэх нэр эсвэл нууц үг буруу',
        message: 'И-мэйл эсвэл нууц үг таарахгүй байна'
      });
    }

    // Нууц үг шалгах
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Нэвтрэх нэр эсвэл нууц үг буруу',
        message: 'И-мэйл эсвэл нууц үг таарахгүй байна'
      });
    }

    // Token үүсгэх
    const token = generateToken(user);

    res.json({
      message: 'Амжилттай нэвтэрлээ',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        register_number: user.register_number,
        is_admin: user.is_admin || false
      },
      token
    });

  } catch (error) {
    console.error('Login алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Өөрийн мэдээлэл авах
const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Хэрэглэгч олдсонгүй',
        message: 'Хэрэглэгчийн мэдээлэл олдсонгүй'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        register_number: user.register_number,
        is_admin: user.is_admin || false,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get profile алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Token шалгах (frontend-д зориулсан)
const verifyToken = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Хэрэглэгч олдсонгүй'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin || false
      }
    });

  } catch (error) {
    console.error('Verify token алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Бүх хэрэглэгчид авах (Admin)
const adminGetAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.json({
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Admin get all users алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Хэрэглэгч устгах (Admin)
const adminDeleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Өөрийгөө устгахыг зөвшөөрөхгүй
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Өөрийгөө устгах боломжгүй',
        message: 'Та өөрийн account-ийг устгах боломжгүй'
      });
    }

    // Хэрэглэгч байгаа эсэхийг шалгах
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Хэрэглэгч олдсонгүй',
        message: 'Устгах хэрэглэгч олдсонгүй'
      });
    }

    // Хэрэглэгчийг устгах
    await deleteUser(userId);

    res.json({
      message: 'Хэрэглэгч амжилттай устгагдлаа',
      deletedUser: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Admin delete user алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  verifyToken,
  adminGetAllUsers,
  adminDeleteUser
};
