const { query } = require('../config/database');

// Wallet авах эсвэл үүсгэх
const getOrCreateWallet = async (userId) => {
  // Эхлээд байгаа эсэхийг шалгах
  let result = await query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Байхгүй бол үүсгэх
  result = await query(
    'INSERT INTO wallets (user_id, balance) VALUES ($1, 0) RETURNING *',
    [userId]
  );

  return result.rows[0];
};

// Wallet авах
const getWalletByUserId = async (userId) => {
  const result = await query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
};

// Wallet үлдэгдэл нэмэх (зээл олгох үед)
const addToWallet = async (userId, amount, description, referenceId, referenceType) => {
  // Wallet байгаа эсэхийг шалгах, байхгүй бол үүсгэх
  const wallet = await getOrCreateWallet(userId);

  // Balance нэмэх
  const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

  await query(
    'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newBalance, wallet.id]
  );

  // Transaction бүртгэх
  await query(
    `INSERT INTO wallet_transactions
     (wallet_id, user_id, type, amount, description, reference_id, reference_type, balance_after)
     VALUES ($1, $2, 'credit', $3, $4, $5, $6, $7)`,
    [wallet.id, userId, amount, description, referenceId, referenceType, newBalance]
  );

  return { ...wallet, balance: newBalance };
};

// Wallet-ээс хасах (төлбөр төлөх, шилжүүлэг хийх үед)
const deductFromWallet = async (userId, amount, description, referenceId, referenceType) => {
  const wallet = await getWalletByUserId(userId);

  if (!wallet) {
    throw new Error('Wallet олдсонгүй');
  }

  if (parseFloat(wallet.balance) < parseFloat(amount)) {
    throw new Error('Үлдэгдэл хүрэлцэхгүй байна');
  }

  // Balance хасах
  const newBalance = parseFloat(wallet.balance) - parseFloat(amount);

  await query(
    'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newBalance, wallet.id]
  );

  // Transaction бүртгэх
  await query(
    `INSERT INTO wallet_transactions
     (wallet_id, user_id, type, amount, description, reference_id, reference_type, balance_after)
     VALUES ($1, $2, 'debit', $3, $4, $5, $6, $7)`,
    [wallet.id, userId, amount, description, referenceId, referenceType, newBalance]
  );

  return { ...wallet, balance: newBalance };
};

// Wallet гүйлгээний түүх авах
const getWalletTransactions = async (userId, limit = 20) => {
  const result = await query(
    `SELECT * FROM wallet_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

// Wallet-ээс банкны данс руу шилжүүлэх
const withdrawToBank = async (userId, amount, bankName, accountNumber) => {
  const wallet = await getWalletByUserId(userId);

  if (!wallet) {
    throw new Error('Wallet олдсонгүй');
  }

  if (parseFloat(wallet.balance) < parseFloat(amount)) {
    throw new Error('Үлдэгдэл хүрэлцэхгүй байна');
  }

  const description = `Банк руу шилжүүлэг: ${bankName} - ${accountNumber}`;

  return await deductFromWallet(userId, amount, description, null, 'bank_withdrawal');
};

module.exports = {
  getOrCreateWallet,
  getWalletByUserId,
  addToWallet,
  deductFromWallet,
  getWalletTransactions,
  withdrawToBank
};
