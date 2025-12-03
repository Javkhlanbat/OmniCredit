import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/application.css';
import { LoansAPI } from '../services/api';
import TokenManager from '../services/auth';

export default function LoanApplication() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(1500000);
  const [term, setTerm] = useState(12);
  const [purpose, setPurpose] = useState('personal');
  const [otherPurpose, setOtherPurpose] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(800000);
  const [occupation, setOccupation] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const calculateMonthly = (loanAmount, rate, months) => {
    if (rate === 0) return loanAmount / months;
    const monthlyRate = rate / 100 / 12;
    return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const rate = 3.0; // 3% хүү
  const monthly = calculateMonthly(amount, rate, term);

  const handleLogout = () => {
    if (window.confirm('Гарахдаа итгэлтэй байна уу?')) {
      TokenManager.clearToken();
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      alert('Зээлийн нөхцөлийг зөвшөөрнө үү');
      return;
    }

    if (!amount || amount === '') {
      alert('Зээлийн дүн оруулна уу');
      return;
    }

    if (!term || term === '') {
      alert('Зээлийн хугацаа сонгоно уу');
      return;
    }

    if (!monthlyIncome || monthlyIncome === '') {
      alert('Сарын орлого оруулна уу');
      return;
    }

    if (!occupation || occupation.trim() === '') {
      alert('Ажил мэргэжил оруулна уу');
      return;
    }

    if (!purpose || purpose === '') {
      alert('Зээлийн зориулалт сонгоно уу');
      return;
    }

    let finalPurpose = purpose;
    if (purpose === 'other') {
      if (!otherPurpose || otherPurpose.trim() === '') {
        alert('Зориулалтаа дэлгэрэнгүй тодорхойлно уу');
        return;
      }
      finalPurpose = otherPurpose;
    }

    try {
      setIsSubmitting(true);

      const loanData = {
        amount: parseFloat(amount),
        duration_months: parseInt(term),
        loan_type: 'personal',
        purpose: finalPurpose,
        monthly_income: parseFloat(monthlyIncome),
        occupation: occupation.trim()
      };

      console.log('Sending loan data:', loanData);

      await LoansAPI.applyForLoan(loanData);

      alert('✓ Амжилттай илгээлээ! Admin батлах хүлээнэ');

      setTimeout(() => {
        navigate('/my-loans');
      }, 2000);
    } catch (error) {
      console.error('Loan application error:', error);
      alert(error.message || 'Хүсэлт илгээхэд алдаа гарлаа');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="application-container">
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Зээлийн хүсэлт</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '48px' }}>
          Хүсэлт бөглөж, админ хянасны дараа зээл батлагдана
        </p>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: '24px' }}>Зээлийн мэдээлэл</h3>

              <div className="form-group">
                <label className="form-label required">Зээлийн дүн</label>
                <div className="number-display">
                  <span className="currency">₮</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    min="100000"
                    max="10000000"
                    step="100000"
                    required
                  />
                </div>
                <input
                  type="range"
                  min="100000"
                  max="10000000"
                  step="100000"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: '12px' }}
                />
                <span className="form-text">₮100,000 - ₮10,000,000</span>
              </div>

              <div className="form-group">
                <label className="form-label required">Зээлийн хугацаа</label>
                <select
                  className="form-control form-select"
                  value={term}
                  onChange={(e) => setTerm(parseInt(e.target.value))}
                  required
                >
                  <option value="">Сонгох</option>
                  <option value="3">3 сар</option>
                  <option value="6">6 сар</option>
                  <option value="12">12 сар</option>
                  <option value="18">18 сар</option>
                  <option value="24">24 сар</option>
                  <option value="36">36 сар</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Зориулалт</label>
                <select
                  className="form-control form-select"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                >
                  <option value="">Сонгох</option>
                  <option value="personal">Хувийн зарцуулалт</option>
                  <option value="business">Бизнес</option>
                  <option value="education">Боловсрол</option>
                  <option value="medical">Эмнэлэг</option>
                  <option value="other">Бусад</option>
                </select>
              </div>

              {purpose === 'other' && (
                <div className="form-group">
                  <label className="form-label">Зориулалт дэлгэрэнгүй</label>
                  <input
                    type="text"
                    className="form-control"
                    value={otherPurpose}
                    onChange={(e) => setOtherPurpose(e.target.value)}
                    placeholder="Зориулалтаа тодорхойлно уу"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label required">Сарын орлого</label>
                <div className="number-display">
                  <span className="currency">₮</span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(parseInt(e.target.value))}
                    min="300000"
                    step="50000"
                    placeholder="800000"
                    required
                  />
                </div>
                <span className="form-text">Таны сарын цалин эсвэл орлого</span>
              </div>

              <div className="form-group">
                <label className="form-label required">Ажил мэргэжил</label>
                <input
                  type="text"
                  className="form-control"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Жишээ: Офисын ажилтан"
                  required
                />
              </div>

              <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid var(--line)' }} />

              <h3 style={{ marginBottom: '16px' }}>Тооцоолол</h3>
              <div className="summary-box">
                <div className="summary-row">
                  <span>Зээлийн дүн:</span>
                  <span className="summary-value">₮{amount.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Хугацаа:</span>
                  <span className="summary-value">{term} сар</span>
                </div>
                <div className="summary-row">
                  <span>Хүүгийн хувь:</span>
                  <span className="summary-value">{rate}%</span>
                </div>
                <div className="summary-row" style={{
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  paddingTop: '12px',
                  marginTop: '12px'
                }}>
                  <span style={{ fontSize: '1.125rem' }}>Сарын төлбөр:</span>
                  <span className="summary-value" style={{ fontSize: '1.5rem' }}>
                    ₮{Math.round(monthly).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="form-check" style={{ marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                />
                <label htmlFor="agreeTerms">
                  Би зээлийн нөхцөл, үйлчилгээний журамтай танилцаж зөвшөөрч байна
                </label>
              </div>

              <div style={{
                padding: '16px',
                background: '#FFF0E6',
                borderLeft: '4px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  ✓ Хүсэлт admin-д илгээгдэж, батлагдсаны дараа зээл идэвхжинэ<br />
                  ✓ Хариуг 1-2 хоногийн дотор өгнө
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
