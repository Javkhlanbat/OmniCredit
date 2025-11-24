const {
  getOrCreateWallet,
  getWalletByUserId,
  getWalletTransactions,
  withdrawToBank,
  deductFromWallet,
  addToWallet
} = require('../models/walletModel');

// Өөрийн wallet авах
const getMyWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getOrCreateWallet(userId);

    res.json({
      wallet: {
        id: wallet.id,
        balance: parseFloat(wallet.balance),
        created_at: wallet.created_at,
        updated_at: wallet.updated_at
      }
    });
  } catch (error) {
    console.error('Get wallet алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Wallet гүйлгээний түүх
const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const transactions = await getWalletTransactions(userId, parseInt(limit));

    res.json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Get transactions алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Банк руу шилжүүлэх
const withdrawToBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bank_name, account_number, account_holder } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Буруу дүн',
        message: 'Шилжүүлэх дүн 0-ээс их байх ёстой'
      });
    }

    if (!bank_name || !account_number) {
      return res.status(400).json({
        error: 'Мэдээлэл дутуу',
        message: 'Банкны нэр болон дансны дугаар заавал шаардлагатай'
      });
    }

    const wallet = await withdrawToBank(userId, amount, bank_name, account_number);

    res.json({
      message: 'Шилжүүлэг амжилттай',
      withdrawal: {
        amount: parseFloat(amount),
        bank_name,
        account_number,
        account_holder,
        new_balance: parseFloat(wallet.balance)
      }
    });
  } catch (error) {
    console.error('Withdraw алдаа:', error);

    if (error.message === 'Үлдэгдэл хүрэлцэхгүй байна') {
      return res.status(400).json({
        error: 'Үлдэгдэл хүрэлцэхгүй',
        message: 'Таны wallet үлдэгдэл хүрэлцэхгүй байна'
      });
    }

    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Wallet-ээс зээлийн төлбөр төлөх
const payLoanFromWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loan_id, amount } = req.body;

    if (!loan_id || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'Буруу мэдээлэл',
        message: 'Зээлийн ID болон дүн заавал шаардлагатай'
      });
    }

    const description = `Зээл #${loan_id} төлбөр`;
    const wallet = await deductFromWallet(userId, amount, description, loan_id, 'loan_payment');

    res.json({
      message: 'Төлбөр амжилттай төлөгдлөө',
      payment: {
        loan_id,
        amount: parseFloat(amount),
        new_balance: parseFloat(wallet.balance)
      }
    });
  } catch (error) {
    console.error('Pay loan алдаа:', error);

    if (error.message === 'Үлдэгдэл хүрэлцэхгүй байна') {
      return res.status(400).json({
        error: 'Үлдэгдэл хүрэлцэхгүй',
        message: 'Таны wallet үлдэгдэл хүрэлцэхгүй байна'
      });
    }

    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Wallet руу мөнгө нэмэх (QPay)
const depositToWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payment_method = 'qpay' } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Буруу дүн',
        message: 'Нэмэх дүн 0-ээс их байх ёстой'
      });
    }

    if (amount < 1000) {
      return res.status(400).json({
        error: 'Буруу дүн',
        message: 'Хамгийн багадаа ₮1,000 нэмэх боломжтой'
      });
    }

    // Demo: QPay төлбөр баталгаажсан гэж үзнэ
    const description = `QPay мөнгө нэмэлт`;
    const wallet = await addToWallet(userId, amount, description, null, 'qpay_deposit');

    res.json({
      message: 'Wallet руу амжилттай нэмэгдлээ',
      deposit: {
        amount: parseFloat(amount),
        payment_method,
        new_balance: parseFloat(wallet.balance)
      }
    });
  } catch (error) {
    console.error('Deposit алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

module.exports = {
  getMyWallet,
  getMyTransactions,
  depositToWallet,
  withdrawToBankAccount,
  payLoanFromWallet
};
