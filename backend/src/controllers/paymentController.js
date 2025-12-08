const {
  createPayment,
  getPaymentsByLoanId,
  getPaymentsByUserId,
  getPaymentById,
  getAllPayments,
  getLoanBalance,
  getPaymentStats
} = require('../models/paymentModel');
const { getLoanById } = require('../models/loanModel');

// Төлбөр хийх
const makePayment = async (req, res) => {
  try {
    const { loan_id, amount, payment_method } = req.body;
    const userId = req.user.id;

    // Зээл байгаа эсэх шалгах
    const loan = await getLoanById(loan_id);
    if (!loan) {
      return res.status(404).json({
        error: 'Зээл олдсонгүй',
        message: 'Тухайн ID-тай зээл олдсонгүй'
      });
    }

    // Зөвхөн өөрийн зээлд төлбөр хийх эрхтэй
    if (loan.user_id !== userId) {
      return res.status(403).json({
        error: 'Хандах эрхгүй',
        message: 'Та энэ зээлд төлбөр хийх эрхгүй'
      });
    }

    // Зээл баталгаажсан эсвэл олгогдсон (disbursed) эсэхийг шалгах
    if (loan.status !== 'approved' && loan.status !== 'disbursed') {
      return res.status(400).json({
        error: 'Зээл баталгаажаагүй',
        message: 'Зөвхөн баталгаажсан эсвэл олгогдсон зээлд төлбөр хийх боломжтой'
      });
    }

    // Үлдэгдэл шалгах
    const balance = await getLoanBalance(loan_id);

    // Нийт үлдэгдлээс их төлбөр хийж болохгүй
    if (amount > balance.balance) {
      return res.status(400).json({
        error: 'Төлбөрийн дүн хэтэрсэн',
        message: `Нийт үлдэгдэл: ${balance.balance.toFixed(2)}₮ (Үндсэн: ${balance.principal_balance.toFixed(2)}₮ + Хүү: ${balance.accrued_interest.toFixed(2)}₮)`
      });
    }

    // Төлбөр үүсгэх
    const payment = await createPayment({
      loan_id,
      amount,
      payment_method: payment_method || 'card'
    });

    // Шинэчлэгдсэн үлдэгдэл
    const newBalance = await getLoanBalance(loan_id);

    res.status(201).json({
      message: 'Төлбөр амжилттай хийгдлээ',
      payment: {
        ...payment,
        breakdown: {
          total: amount,
          interest_paid: payment.interest_amount,
          principal_paid: payment.principal_amount
        }
      },
      balance: newBalance
    });

  } catch (error) {
    console.error('Make payment алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Зээлийн төлбөрүүд авах
const getLoanPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    // Зээл байгаа эсэх шалгах
    const loan = await getLoanById(loanId);
    if (!loan) {
      return res.status(404).json({
        error: 'Зээл олдсонгүй'
      });
    }

    // Зөвхөн өөрийн зээлийн төлбөрүүдийг харах эрхтэй
    if (loan.user_id !== userId) {
      return res.status(403).json({
        error: 'Хандах эрхгүй'
      });
    }

    const payments = await getPaymentsByLoanId(loanId);
    const balance = await getLoanBalance(loanId);

    res.json({
      count: payments.length,
      payments,
      balance
    });

  } catch (error) {
    console.error('Get loan payments алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Өөрийн бүх төлбөрүүд
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await getPaymentsByUserId(userId);

    res.json({
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error('Get my payments алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Төлбөрийн дэлгэрэнгүй
const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        error: 'Төлбөр олдсонгүй'
      });
    }

    // Зээл авах
    const loan = await getLoanById(payment.loan_id);

    // Зөвхөн өөрийн төлбөрийг харах эрхтэй
    if (loan.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Хандах эрхгүй'
      });
    }

    res.json({ payment });

  } catch (error) {
    console.error('Get payment details алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Төлбөрийн статистик
const getMyPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getPaymentStats(userId);

    res.json({ stats });

  } catch (error) {
    console.error('Get payment stats алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Зээлийн үлдэгдэл
const checkLoanBalance = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await getLoanById(loanId);
    if (!loan) {
      return res.status(404).json({
        error: 'Зээл олдсонгүй'
      });
    }

    if (loan.user_id !== userId) {
      return res.status(403).json({
        error: 'Хандах эрхгүй'
      });
    }

    const balance = await getLoanBalance(loanId);

    res.json({ balance });

  } catch (error) {
    console.error('Check loan balance алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Бүх төлбөрүүд (Админ)
const adminGetAllPayments = async (req, res) => {
  try {
    const payments = await getAllPayments();

    res.json({
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error('Admin get all payments алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

module.exports = {
  makePayment,
  getLoanPayments,
  getMyPayments,
  getPaymentDetails,
  getMyPaymentStats,
  checkLoanBalance,
  adminGetAllPayments
};
