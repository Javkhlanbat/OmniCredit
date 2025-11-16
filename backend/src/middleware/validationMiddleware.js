// Email шалгах
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Утасны дугаар шалгах (Монголын формат)
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Регистрийн дугаар шалгах (2 үсэг + 8 тоо)
const validateRegisterNumber = (regNumber) => {
  const regNumberRegex = /^[А-Яа-яӨҮөүA-Za-z]{2}[0-9]{8}$/;
  return regNumberRegex.test(regNumber);
};

// Нууц үг шалгах (хамгийн багадаа 6 тэмдэгт)
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Бүртгэлийн өгөгдөл шалгах
const validateRegistration = (req, res, next) => {
  const { email, password, first_name, last_name, phone, register_number } = req.body;

  // Шаардлагатай талбарууд
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({
      error: 'Дутуу мэдээлэл',
      message: 'И-мэйл, нууц үг, нэр, овог оруулна уу'
    });
  }

  // Email шалгах
  if (email && !validateEmail(email)) {
    return res.status(400).json({
      error: 'И-мэйл буруу',
      message: 'Зөв и-мэйл хаяг оруулна уу'
    });
  }

  // Нууц үг шалгах
  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'Нууц үг богино байна',
      message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'
    });
  }

  // Утас шалгах (хэрэв байвал)
  if (phone && !validatePhone(phone)) {
    return res.status(400).json({
      error: 'Утасны дугаар буруу',
      message: '8 оронтой утасны дугаар оруулна уу'
    });
  }

  // Регистрийн дугаар шалгах (хэрэв байвал)
  if (register_number && !validateRegisterNumber(register_number)) {
    return res.status(400).json({
      error: 'Регистрийн дугаар буруу',
      message: 'Зөв форматтай регистрийн дугаар оруулна уу (жишээ: АБ12345678)'
    });
  }

  next();
};

// Нэвтрэх өгөгдөл шалгах
const validateLogin = (req, res, next) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    return res.status(400).json({
      error: 'Дутуу мэдээлэл',
      message: 'И-мэйл эсвэл утас болон нууц үг оруулна уу'
    });
  }

  // И-мэйл байвал л шалгах
  if (email && !validateEmail(email)) {
    return res.status(400).json({
      error: 'И-мэйл буруу',
      message: 'Зөв и-мэйл хаяг оруулна уу'
    });
  }

  // Утас байвал л шалгах
  if (phone && !validatePhone(phone)) {
    return res.status(400).json({
      error: 'Утасны дугаар буруу',
      message: '8 оронтой монгол дугаар оруулна уу'
    });
  }

  next();
};

// Зээлийн хүсэлт шалгах
const validateLoanApplication = (req, res, next) => {
  const { loan_type, amount, duration_months } = req.body;

  if (!loan_type || !amount || !duration_months) {
    return res.status(400).json({
      error: 'Дутуу мэдээлэл',
      message: 'Зээлийн төрөл, дүн, хугацаа оруулна уу'
    });
  }

  // Дүн шалгах
  if (amount <= 0 || amount > 100000000) {
    return res.status(400).json({
      error: 'Дүн буруу',
      message: 'Зээлийн дүн 0-100,000,000 хооронд байх ёстой'
    });
  }

  // Хугацаа шалгах
  if (duration_months < 1 || duration_months > 360) {
    return res.status(400).json({
      error: 'Хугацаа буруу',
      message: 'Зээлийн хугацаа 1-360 сар хооронд байх ёстой'
    });
  }

  next();
};

// Төлбөр шалгах
const validatePayment = (req, res, next) => {
  const { loan_id, amount, payment_method } = req.body;

  if (!loan_id || !amount) {
    return res.status(400).json({
      error: 'Дутуу мэдээлэл',
      message: 'Зээлийн ID болон төлбөрийн дүн оруулна уу'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      error: 'Дүн буруу',
      message: 'Төлбөрийн дүн 0-ээс их байх ёстой'
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateLoanApplication,
  validatePayment
};
