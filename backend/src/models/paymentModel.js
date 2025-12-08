const { query } = require('../config/database');

// Төлбөр үүсгэх
const createPayment = async (paymentData) => {
  const { loan_id, amount, payment_method } = paymentData;

  const result = await query(
    `INSERT INTO payments (loan_id, amount, payment_method, status)
     VALUES ($1, $2, $3, 'completed')
     RETURNING *`,
    [loan_id, amount, payment_method]
  );

  return result.rows[0];
};

// Зээлийн төлбөрүүд
const getPaymentsByLoanId = async (loanId) => {
  const result = await query(
    'SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC',
    [loanId]
  );
  return result.rows;
};

// Хэрэглэгчийн бүх төлбөрүүд
const getPaymentsByUserId = async (userId) => {
  const result = await query(
    `SELECT p.*, l.loan_type, l.amount as loan_amount
     FROM payments p
     JOIN loans l ON p.loan_id = l.id
     WHERE l.user_id = $1
     ORDER BY p.payment_date DESC`,
    [userId]
  );
  return result.rows;
};

// ID-гаар төлбөр хайх
const getPaymentById = async (id) => {
  const result = await query(
    'SELECT * FROM payments WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Бүх төлбөрүүд (админд зориулсан)
const getAllPayments = async () => {
  const result = await query(
    `SELECT p.*, l.loan_type, l.amount as loan_amount, u.email, u.first_name, u.last_name
     FROM payments p
     JOIN loans l ON p.loan_id = l.id
     JOIN users u ON l.user_id = u.id
     ORDER BY p.payment_date DESC`
  );
  return result.rows;
};

// Төлбөрийн статус өөрчлөх
const updatePaymentStatus = async (id, status) => {
  const result = await query(
    'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

// Төлбөр устгах
const deletePayment = async (id) => {
  await query('DELETE FROM payments WHERE id = $1', [id]);
};

// Зээлийн нийт төлсөн дүн
const getTotalPaidByLoanId = async (loanId) => {
  const result = await query(
    `SELECT COALESCE(SUM(amount), 0) as total_paid
     FROM payments
     WHERE loan_id = $1 AND status = 'completed'`,
    [loanId]
  );
  return parseFloat(result.rows[0].total_paid);
};

// Зээлийн үлдэгдэл дүн тооцоолох
const getLoanBalance = async (loanId) => {
  const loanResult = await query(
    'SELECT amount, total_amount FROM loans WHERE id = $1',
    [loanId]
  );

  if (loanResult.rows.length === 0) {
    throw new Error('Зээл олдсонгүй');
  }

  // total_amount (хүүтэй нийт дүн) байвал түүнийг, үгүй бол amount (суурь дүн) ашиглана
  const loanAmount = parseFloat(loanResult.rows[0].total_amount || loanResult.rows[0].amount);
  const totalPaid = await getTotalPaidByLoanId(loanId);

  return {
    loan_amount: loanAmount,
    total_paid: totalPaid,
    balance: loanAmount - totalPaid
  };
};

// Төлбөрийн статистик
const getPaymentStats = async (userId) => {
  const result = await query(
    `SELECT
       COUNT(*) as total_payments,
       COALESCE(SUM(amount), 0) as total_amount,
       COALESCE(AVG(amount), 0) as avg_payment
     FROM payments p
     JOIN loans l ON p.loan_id = l.id
     WHERE l.user_id = $1 AND p.status = 'completed'`,
    [userId]
  );
  return result.rows[0];
};

module.exports = {
  createPayment,
  getPaymentsByLoanId,
  getPaymentsByUserId,
  getPaymentById,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
  getTotalPaidByLoanId,
  getLoanBalance,
  getPaymentStats
};
