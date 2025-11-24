const { query } = require('../config/database');

// ==========================================
// КОМПАНИ (COMPANIES)
// ==========================================

// Компани үүсгэх
const createCompany = async (companyData) => {
  const { name, description, contact_email, contact_phone, address, is_active = true } = companyData;

  const result = await query(
    `INSERT INTO companies (name, description, contact_email, contact_phone, address, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, contact_email, contact_phone, address, is_active]
  );

  return result.rows[0];
};

// Бүх компаниуд
const getAllCompanies = async () => {
  const result = await query(
    'SELECT * FROM companies ORDER BY created_at DESC'
  );
  return result.rows;
};

// Компани ID-аар олох
const getCompanyById = async (id) => {
  const result = await query(
    'SELECT * FROM companies WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Компани шинэчлэх
const updateCompany = async (id, companyData) => {
  const { name, description, contact_email, contact_phone, address, is_active } = companyData;

  const result = await query(
    `UPDATE companies
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         contact_email = COALESCE($3, contact_email),
         contact_phone = COALESCE($4, contact_phone),
         address = COALESCE($5, address),
         is_active = COALESCE($6, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [name, description, contact_email, contact_phone, address, is_active, id]
  );

  return result.rows[0];
};

// Компани устгах
const deleteCompany = async (id) => {
  await query('DELETE FROM companies WHERE id = $1', [id]);
};

// ==========================================
// НЭМЭГДЛИЙН КОД (PROMO CODES)
// ==========================================

// Random код үүсгэх функц
const generatePromoCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'OMNI-';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Нэмэгдлийн код үүсгэх
const createPromoCode = async (promoData) => {
  const {
    company_id,
    code = generatePromoCode(),
    discount_percent = 0,
    interest_rate_override = null,
    max_loan_amount = null,
    max_uses = null,
    expires_at = null,
    description = ''
  } = promoData;

  const result = await query(
    `INSERT INTO promo_codes (company_id, code, discount_percent, interest_rate_override, max_loan_amount, max_uses, expires_at, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [company_id, code, discount_percent, interest_rate_override, max_loan_amount, max_uses, expires_at, description]
  );

  return result.rows[0];
};

// Бүх нэмэгдлийн кодууд
const getAllPromoCodes = async () => {
  const result = await query(
    `SELECT p.*, c.name as company_name
     FROM promo_codes p
     LEFT JOIN companies c ON p.company_id = c.id
     ORDER BY p.created_at DESC`
  );
  return result.rows;
};

// Компаний нэмэгдлийн кодууд
const getPromoCodesByCompany = async (companyId) => {
  const result = await query(
    `SELECT * FROM promo_codes WHERE company_id = $1 ORDER BY created_at DESC`,
    [companyId]
  );
  return result.rows;
};

// Код-аар хайх (хэрэглэгч ашиглахад)
const getPromoCodeByCode = async (code) => {
  const result = await query(
    `SELECT p.*, c.name as company_name, c.is_active as company_active
     FROM promo_codes p
     LEFT JOIN companies c ON p.company_id = c.id
     WHERE UPPER(p.code) = UPPER($1)`,
    [code]
  );
  return result.rows[0];
};

// Код хүчинтэй эсэх шалгах
const validatePromoCode = async (code) => {
  const promo = await getPromoCodeByCode(code);

  if (!promo) {
    return { valid: false, error: 'Нэмэгдлийн код олдсонгүй' };
  }

  if (!promo.is_active) {
    return { valid: false, error: 'Энэ код идэвхгүй байна' };
  }

  if (!promo.company_active) {
    return { valid: false, error: 'Компани идэвхгүй байна' };
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, error: 'Кодын хугацаа дууссан байна' };
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return { valid: false, error: 'Код ашиглах дээд хязгаарт хүрсэн' };
  }

  return { valid: true, promo };
};

// Код ашигласан тоо нэмэх
const incrementPromoCodeUsage = async (id) => {
  const result = await query(
    `UPDATE promo_codes
     SET used_count = used_count + 1
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
};

// Код ID-аар олох
const getPromoCodeById = async (id) => {
  const result = await query(
    `SELECT p.*, c.name as company_name
     FROM promo_codes p
     LEFT JOIN companies c ON p.company_id = c.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0];
};

// Код шинэчлэх
const updatePromoCode = async (id, promoData) => {
  const { discount_percent, interest_rate_override, max_loan_amount, max_uses, expires_at, is_active, description } = promoData;

  const result = await query(
    `UPDATE promo_codes
     SET discount_percent = COALESCE($1, discount_percent),
         interest_rate_override = COALESCE($2, interest_rate_override),
         max_loan_amount = COALESCE($3, max_loan_amount),
         max_uses = COALESCE($4, max_uses),
         expires_at = COALESCE($5, expires_at),
         is_active = COALESCE($6, is_active),
         description = COALESCE($7, description)
     WHERE id = $8
     RETURNING *`,
    [discount_percent, interest_rate_override, max_loan_amount, max_uses, expires_at, is_active, description, id]
  );

  return result.rows[0];
};

// Код устгах
const deletePromoCode = async (id) => {
  await query('DELETE FROM promo_codes WHERE id = $1', [id]);
};

module.exports = {
  // Companies
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,

  // Promo Codes
  generatePromoCode,
  createPromoCode,
  getAllPromoCodes,
  getPromoCodesByCompany,
  getPromoCodeByCode,
  validatePromoCode,
  incrementPromoCodeUsage,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode
};
