const {
  createLoan,
  getLoansByUserId,
  getLoanById,
  getAllLoans,
  updateLoanStatus,
  disburseLoan,
  getLoanStats,
  createPurchaseLoan,
  getPurchaseLoansByUserId,
  getPurchaseLoanByInvoice
} = require('../models/loanModel');

const {
  validatePromoCode,
  getPromoCodeByCode,
  incrementPromoCodeUsage
} = require('../models/promoCodeModel');

// Хүүгийн хувь тооцоолох (зээлийн төрлөөс хамаарна)
const calculateInterestRate = (loanType, amount, duration) => {
  const rates = {
    'personal': 3.0,      // Хувийн зээл 3%
    'purchase': 0.0        // Худалдан авалтын зээл 0%
  };

  return rates[loanType] || 15.0;
};

// Сарын төлбөр тооцоолох
const calculateMonthlyPayment = (amount, interestRate, durationMonths) => {
  if (interestRate === 0) {
    // 0% хүүтэй бол зөвхөн үндсэн дүнг хуваах
    return amount / durationMonths;
  }
  const monthlyRate = interestRate / 100 / 12;
  const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
                  (Math.pow(1 + monthlyRate, durationMonths) - 1);

  return Math.round(payment * 100) / 100;
};

// Зээл хүсэлт илгээх
const applyForLoan = async (req, res) => {
  try {
    const {
      loan_type = 'personal',
      amount,
      duration_months,
      purpose,
      monthly_income,
      occupation,
      promo_code
    } = req.body;
    const userId = req.user.id;

    console.log('Received loan application:', req.body);

    // Validation
    if (!amount || isNaN(amount) || amount < 100000 || amount > 10000000) {
      return res.status(400).json({
        error: 'Буруу дүн',
        message: 'Зээлийн дүн 100,000-10,000,000 хооронд байх ёстой'
      });
    }

    if (!duration_months || isNaN(duration_months) || duration_months < 1 || duration_months > 60) {
      return res.status(400).json({
        error: 'Буруу хугацаа',
        message: 'Зээлийн хугацаа 1-60 сар хооронд байх ёстой'
      });
    }

    if (!monthly_income || isNaN(monthly_income) || monthly_income < 300000) {
      return res.status(400).json({
        error: 'Буруу орлого',
        message: 'Сарын орлого доод тал нь 300,000₮ байх ёстой'
      });
    }

    if (!occupation || occupation.trim() === '') {
      return res.status(400).json({
        error: 'Буруу мэдээлэл',
        message: 'Ажил мэргэжил заавал бөглөх шаардлагатай'
      });
    }

    if (!purpose || purpose.trim() === '') {
      return res.status(400).json({
        error: 'Буруу мэдээлэл',
        message: 'Зээлийн зориулалт заавал бөглөх шаардлагатай'
      });
    }

    let promoCodeId = null;
    let appliedInterestRate = null;

    if (promo_code && promo_code.trim() !== '') {
      const promoValidation = await validatePromoCode(promo_code.trim());

      if (!promoValidation.valid) {
        return res.status(400).json({
          error: 'Буруу нэхэмжлийн код',
          message: promoValidation.error
        });
      }

      promoCodeId = promoValidation.promo.id;

      // Хүү override байвал ашиглах
      if (promoValidation.promo.interest_rate_override !== null) {
        appliedInterestRate = parseFloat(promoValidation.promo.interest_rate_override);
      }

      // Код ашигласан тоог нэмэх
      await incrementPromoCodeUsage(promoCodeId);
    }

    // Хүү тооцоолох (promo code-ийн хүү байвал түүнийг ашиглах)
    const interestRate = appliedInterestRate !== null
      ? appliedInterestRate
      : calculateInterestRate(loan_type, amount, duration_months);

    // Сарын төлбөр тооцоолох
    const monthlyPayment = calculateMonthlyPayment(amount, interestRate, duration_months);

    // Нийт төлөх дүн
    const totalAmount = monthlyPayment * duration_months;

    // Зээл үүсгэх
    const loan = await createLoan({
      user_id: userId,
      loan_type,
      amount,
      interest_rate: interestRate,
      term_months: duration_months,
      monthly_payment: monthlyPayment,
      total_amount: totalAmount,
      purpose,
      monthly_income,
      occupation,
      promo_code_id: promoCodeId
    });

    res.status(201).json({
      message: 'Зээлийн хүсэлт амжилттай илгээгдлээ',
      loan: {
        id: loan.id,
        loan_type: loan.loan_type,
        amount: loan.amount,
        interest_rate: loan.interest_rate,
        term_months: loan.term_months,
        monthly_payment: loan.monthly_payment,
        total_amount: loan.total_amount,
        status: loan.status,
        created_at: loan.created_at,
        promo_code_id: loan.promo_code_id
      }
    });

  } catch (error) {
    console.error('Apply for loan алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Өөрийн зээлүүд авах
const getMyLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await getLoansByUserId(userId);

    res.json({
      count: loans.length,
      loans
    });

  } catch (error) {
    console.error('Get my loans алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Зээлийн дэлгэрэнгүй мэдээлэл
const getLoanDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const loan = await getLoanById(parseInt(id));

    if (!loan) {
      return res.status(404).json({
        error: 'Зээл олдсонгүй',
        message: 'Тухайн ID-тай зээл олдсонгүй'
      });
    }

    // Зөвхөн өөрийн зээлийг харах эрхтэй
    if (loan.user_id !== userId) {
      return res.status(403).json({
        error: 'Хандах эрхгүй',
        message: 'Та энэ зээлийн мэдээллийг харах эрхгүй'
      });
    }

    res.json({ loan });

  } catch (error) {
    console.error('Get loan details алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Зээлийн статистик авах
const getMyLoanStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getLoanStats(userId);

    res.json({ stats });

  } catch (error) {
    console.error('Get loan stats алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Purchase loan (0% хүүтэй худалдан авалтын зээл)
const applyForPurchaseLoan = async (req, res) => {
  try {
    const { invoice_code, amount, duration_months } = req.body;
    const userId = req.user.id;

    // Invoice code давхцаж байгаа эсэх шалгах
    const existingLoan = await getPurchaseLoanByInvoice(invoice_code);
    if (existingLoan) {
      return res.status(400).json({
        error: 'Invoice давхцаж байна',
        message: 'Энэ invoice код-оор аль хэдийн зээл авсан байна'
      });
    }

    // Сарын төлбөр (0% хүү тул зөвхөн үндсэн дүнг хуваах)
    const monthlyPayment = calculateMonthlyPayment(amount, 0, duration_months);

    const purchaseLoan = await createPurchaseLoan({
      user_id: userId,
      invoice_code,
      amount,
      duration_months,
      monthly_payment: monthlyPayment
    });

    res.status(201).json({
      message: 'Худалдан авалтын зээл амжилттай үүсгэгдлээ',
      loan: purchaseLoan
    });

  } catch (error) {
    console.error('Apply for purchase loan алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Өөрийн purchase loans
const getMyPurchaseLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await getPurchaseLoansByUserId(userId);

    res.json({
      count: loans.length,
      loans
    });

  } catch (error) {
    console.error('Get my purchase loans алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Бүх зээлүүд (Админ)
const adminGetAllLoans = async (req, res) => {
  try {
    const loans = await getAllLoans();

    res.json({
      count: loans.length,
      loans
    });

  } catch (error) {
    console.error('Admin get all loans алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Зээлийн статус өөрчлөх 
// approved хийхэд шууд wallet-д мөнгө орно, disbursed статус руу шилжинэ
const adminUpdateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Буруу статус',
        message: `Статус нь ${validStatuses.join(', ')}-ийн аль нэг байх ёстой`
      });
    }

    // Хэрэв approved бол шууд disbursed болгож, wallet-д мөнгө нэмнэ
    if (status === 'approved') {
      // Эхлээд зээл байгаа эсэхийг шалгах
      const existingLoan = await getLoanById(parseInt(id));

      if (!existingLoan) {
        return res.status(404).json({
          error: 'Зээл олдсонгүй'
        });
      }

      if (existingLoan.status !== 'pending') {
        return res.status(400).json({
          error: 'Зөвхөн хүлээгдэж буй зээлийг зөвшөөрөх боломжтой'
        });
      }

      // Шууд disbursed болгож, wallet-д мөнгө нэмнэ
      const loan = await disburseLoan(parseInt(id));

      // Хэрэв disburseLoan ажиллахгүй бол (status approved биш байсан гэх мэт)
      // Эхлээд approved болгоод, дараа нь disburse хийнэ
      if (!loan) {
        await updateLoanStatus(parseInt(id), 'approved');
        const disbursedLoan = await disburseLoan(parseInt(id));

        return res.json({
          message: 'Зээл зөвшөөрөгдөж, хэрэглэгчийн wallet-д шилжүүлэгдлээ',
          loan: disbursedLoan,
          disbursement: {
            amount: disbursedLoan.amount,
            recipient_user_id: disbursedLoan.user_id
          }
        });
      }

      return res.json({
        message: 'Зээл зөвшөөрөгдөж, хэрэглэгчийн wallet-д шилжүүлэгдлээ',
        loan,
        disbursement: {
          amount: loan.amount,
          recipient_user_id: loan.user_id
        }
      });
    }

    // Бусад статус (rejected, completed гэх мэт)
    const loan = await updateLoanStatus(parseInt(id), status);

    if (!loan) {
      return res.status(404).json({
        error: 'Зээл олдсонгүй'
      });
    }

    res.json({
      message: 'Зээлийн статус амжилттай өөрчлөгдлөө',
      loan
    });

  } catch (error) {
    console.error('Admin update loan status алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

// Зээл олгох (Админ) - approved зээлийг disbursed болгох
const adminDisburseLoan = async (req, res) => {
  try {
    const { id } = req.params;

    // Эхлээд зээл байгаа эсэхийг шалгах
    const existingLoan = await getLoanById(parseInt(id));

    if (!existingLoan) {
      return res.status(404).json({
        error: 'Зээл олдсонгүй',
        message: 'Тухайн ID-тай зээл олдсонгүй'
      });
    }

    if (existingLoan.status !== 'approved') {
      return res.status(400).json({
        error: 'Зээл олгох боломжгүй',
        message: 'Зөвхөн "approved" статустай зээлийг олгох боломжтой'
      });
    }

    const loan = await disburseLoan(parseInt(id));

    if (!loan) {
      return res.status(500).json({
        error: 'Зээл олгоход алдаа гарлаа'
      });
    }

    // Энд жинхэнэ мөнгө шилжүүлэх логик орох боломжтой
    // Одоогоор зөвхөн статус өөрчилж байна

    res.json({
      message: 'Зээл амжилттай олгогдлоо! Хэрэглэгчийн дансанд шилжүүлэгдлээ.',
      loan,
      disbursement: {
        loan_id: loan.id,
        amount: loan.amount,
        disbursed_at: loan.disbursed_at,
        recipient_user_id: loan.user_id
      }
    });

  } catch (error) {
    console.error('Admin disburse loan алдаа:', error);
    res.status(500).json({
      error: 'Серверт алдаа гарлаа',
      message: error.message
    });
  }
};

module.exports = {
  applyForLoan,
  getMyLoans,
  getLoanDetails,
  getMyLoanStats,
  applyForPurchaseLoan,
  getMyPurchaseLoans,
  adminGetAllLoans,
  adminUpdateLoanStatus,
  adminDisburseLoan
};
