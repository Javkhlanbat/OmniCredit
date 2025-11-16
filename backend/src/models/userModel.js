const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// Хэрэглэгч үүсгэх
const createUser = async (userData) => {
  const { email, password, first_name, last_name, phone, register_number } = userData;

  // Нууц үг hash-лах
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const result = await query(
    `INSERT INTO users (email, password, first_name, last_name, phone, register_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name, phone, register_number, created_at`,
    [email, hashedPassword, first_name, last_name, phone, register_number]
  );

  return result.rows[0];
};

// И-мэйлээр хэрэглэгч хайх
const findUserByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

const findUserByPhone = async (phone) => {
  const result = await query(
    'SELECT * FROM users WHERE phone = $1',
    [phone]
  );
  return result.rows[0];
};

// ID-гаар хэрэглэгч хайх
const findUserById = async (id) => {
  const result = await query(
    'SELECT id, email, first_name, last_name, phone, register_number, is_admin, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Нууц үг шалгах
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Хэрэглэгчийн мэдээлэл шинэчлэх
const updateUser = async (id, updates) => {
  const { first_name, last_name, phone, register_number } = updates;

  const result = await query(
    `UPDATE users
     SET first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         register_number = COALESCE($4, register_number),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING id, email, first_name, last_name, phone, register_number, updated_at`,
    [first_name, last_name, phone, register_number, id]
  );

  return result.rows[0];
};

// Нууц үг солих
const updatePassword = async (id, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, id]
  );
};

// Хэрэглэгч устгах
const deleteUser = async (id) => {
  await query('DELETE FROM users WHERE id = $1', [id]);
};

// Бүх хэрэглэгчид (админд зориулсан)
const getAllUsers = async () => {
  const result = await query(
    'SELECT id, email, first_name, last_name, phone, register_number, is_admin, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  verifyPassword,
  updateUser,
  updatePassword,
  deleteUser,
  getAllUsers
};
