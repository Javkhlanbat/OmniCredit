const { query } = require('../config/database');

// Төлбөр үүсгэх (хүү болон үндсэн зээлийг тусад нь тооцоолох)
const createPayment = async (paymentData) => {
  const { loan_id, amount, payment_method } = paymentData;

  // Одоогийн үлдэгдэл болон хүүг тооцоолох
  const balance = await getLoanBalance(loan_id);

  // Хүү тооцоолох (сарын хүү * үндсэн үлдэгдэл)
  const interestAmount = balance.accrued_interest;

  // Төлбөр нь хүүг эхлээд барагдуулж, үлдсэн хэсэг нь үндсэн зээлд орно
  let principalAmount = 0;
  let actualInterestPaid = 0;

  if (amount >= interestAmount) {
    // Хэрэв төлбөр хүүнээс их бол: эхлээд хүүг бүхэлд нь барагдуулаад, үлдсэн хэсгийг үндсэн зээлд
    actualInterestPaid = interestAmount;
    principalAmount = amount - interestAmount;
  } else {
    // Хэрэв төлбөр хүүнээс бага бол: зөвхөн хүүг хэсэгчлэн төлнө
    actualInterestPaid = amount;
    principalAmount = 0;
  }

  const result = await query(
    `INSERT INTO payments (loan_id, amount, principal_amount, interest_amount, payment_method, status)
     VALUES ($1, $2, $3, $4, $5, 'completed')
     RETURNING *`,
    [loan_id, amount, principalAmount, actualInterestPaid, payment_method]
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

// Зээлийн нийт төлсөн дүн (үндсэн болон хүү тусад нь)
const getTotalPaidByLoanId = async (loanId) => {
  const result = await query(
    `SELECT
       COALESCE(SUM(amount), 0) as total_paid,
       COALESCE(SUM(principal_amount), 0) as total_principal_paid,
       COALESCE(SUM(interest_amount), 0) as total_interest_paid
     FROM payments
     WHERE loan_id = $1 AND status = 'completed'`,
    [loanId]
  );
  return {
    total_paid: parseFloat(result.rows[0].total_paid),
    total_principal_paid: parseFloat(result.rows[0].total_principal_paid),
    total_interest_paid: parseFloat(result.rows[0].total_interest_paid)
  };
};

// Зээлийн үлдэгдэл дүн тооцоолох (сар бүрийн хүүтэй)
const getLoanBalance = async (loanId) => {
  const loanResult = await query(
    `SELECT amount, interest_rate, disbursed_at, term_months
     FROM loans
     WHERE id = $1`,
    [loanId]
  );

  if (loanResult.rows.length === 0) {
    throw new Error('Зээл олдсонгүй');
  }

  const loan = loanResult.rows[0];
  const originalAmount = parseFloat(loan.amount); // Үндсэн зээлийн дүн
  const annualInterestRate = parseFloat(loan.interest_rate); // Жилийн хүү (%)
  const monthlyInterestRate = annualInterestRate / 100 / 12; // Сарын хүү (decimal)
  const disbursedDate = loan.disbursed_at ? new Date(loan.disbursed_at) : new Date();

  // Төлсөн дүнгүүд
  const paymentData = await getTotalPaidByLoanId(loanId);
  const totalPrincipalPaid = paymentData.total_principal_paid;
  const totalInterestPaid = paymentData.total_interest_paid;

  // Үндсэн зээлийн үлдэгдэл
  const principalBalance = originalAmount - totalPrincipalPaid;

  // Хэдэн сар өнгөрсөн тооцоолох
  const now = new Date();
  const monthsElapsed = Math.floor(
    (now.getTime() - disbursedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Хуримтлагдсан хүү тооцоолох (сар бүрийн compound interest)
  // Энэ нь зөвхөн үндсэн үлдэгдэл дээр тооцогдоно
  let accruedInterest = 0;

  // Энгийн хүү тооцоо: Үндсэн үлдэгдэл * сарын хүү
  // (Compound interest-ийн оронд энгийн хүү ашиглах нь илүү ойлгомжтой)
  accruedInterest = principalBalance * monthlyInterestRate;

  // Нийт үлдэгдэл = Үндсэн үлдэгдэл + Хуримтлагдсан хүү - Төлсөн хүү
  const totalBalance = principalBalance + accruedInterest;

  return {
    original_amount: originalAmount,
    principal_balance: principalBalance,
    accrued_interest: accruedInterest,
    total_principal_paid: totalPrincipalPaid,
    total_interest_paid: totalInterestPaid,
    total_paid: paymentData.total_paid,
    balance: totalBalance,
    monthly_interest_rate: monthlyInterestRate,
    months_elapsed: monthsElapsed
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
