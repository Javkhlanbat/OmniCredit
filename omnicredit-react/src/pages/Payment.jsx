import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/payment.css';
import { LoansAPI, WalletAPI, PaymentsAPI } from '../services/api';
import TokenManager from '../services/auth';

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loanIdFromUrl = searchParams.get('loan');

  const [allLoans, setAllLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
      return;
    }
    initPage();
  }, [navigate]);

  useEffect(() => {
    if (loanIdFromUrl && allLoans.length > 0) {
      setSelectedLoanId(parseInt(loanIdFromUrl));
    }
  }, [loanIdFromUrl, allLoans]);

  useEffect(() => {
    if (selectedLoanId) {
      updateAmountForLoan(selectedLoanId);
    }
  }, [selectedLoanId]);

  const initPage = async () => {
    try {
      setLoading(true);
      await Promise.all([loadActiveLoans(), loadWalletBalance()]);
      setLoading(false);
    } catch (error) {
      console.error('Init page error:', error);
      setLoading(false);
    }
  };

  const loadActiveLoans = async () => {
    try {
      const response = await LoansAPI.getMyLoans();
      const loans = Array.isArray(response) ? response : (response.loans || []);
      const activeLoans = loans.filter(loan =>
        loan.status === 'disbursed' || loan.status === 'active' || loan.status === 'approved'
      );
      setAllLoans(activeLoans);
    } catch (error) {
      console.error('Load loans error:', error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const response = await WalletAPI.getMyWallet();
      setWalletBalance(parseFloat(response.wallet.balance) || 0);
    } catch (error) {
      console.error('Load wallet error:', error);
      setWalletBalance(0);
    }
  };

  const updateAmountForLoan = (loanId) => {
    const loan = allLoans.find(l => l.id === loanId);
    if (!loan) return;

    const totalAmount = loan.total_amount || loan.amount;
    const paidAmount = loan.paid_amount || 0;
    const remaining = totalAmount - paidAmount;
    const termMonths = loan.term_months || loan.term || 12;
    const monthlyPayment = loan.monthly_payment || Math.round(loan.amount / termMonths);

    if (remaining > 0) {
      setAmount(Math.min(monthlyPayment, remaining));
    }
  };

  const handleLoanChange = (e) => {
    const loanId = parseInt(e.target.value);
    if (loanId) {
      setSelectedLoanId(loanId);
    } else {
      setSelectedLoanId(null);
      setAmount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLoanId) {
      alert('Зээл сонгоно уу');
      return;
    }

    if (!amount || amount <= 0) {
      alert('Төлбөрийн дүн оруулна уу');
      return;
    }

    if (amount > walletBalance) {
      alert('Wallet үлдэгдэл хүрэлцэхгүй байна. Dashboard-аас мөнгө нэмнэ үү.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Pay from wallet
      await WalletAPI.payLoanFromWallet({
        loan_id: selectedLoanId,
        amount: amount
      });

      // Also record in payments table
      await PaymentsAPI.makePayment({
        loan_id: selectedLoanId,
        amount: amount,
        payment_method: 'wallet'
      });

      alert('Амжилттай төлөгдлөө!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.message || 'Төлбөр төлөхөд алдаа гарлаа');
      setIsSubmitting(false);
    }
  };

  const renderInvoice = () => {
    if (!selectedLoanId) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <p>Зээл сонгоно уу</p>
        </div>
      );
    }

    const loan = allLoans.find(l => l.id === selectedLoanId);
    if (!loan) return null;

    const totalAmount = loan.total_amount || loan.amount;
    const paidAmount = loan.paid_amount || 0;
    const remaining = totalAmount - paidAmount;
    const interest = totalAmount - loan.amount;
    const termMonths = loan.term_months || loan.term || 12;
    const monthlyPayment = loan.monthly_payment || Math.round(loan.amount / termMonths);

    const statusInfo = {
      'disbursed': { label: 'Олгогдсон', color: '#059669' },
      'active': { label: 'Идэвхтэй', color: '#10b981' },
      'approved': { label: 'Зөвшөөрөгдсөн', color: '#10b981' }
    }[loan.status] || { label: loan.status, color: '#6B7280' };

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Зээл #{loan.id}</span>
          <span style={{ fontWeight: '700', color: statusInfo.color }}>{statusInfo.label}</span>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Үндсэн зээл:</span>
            <span style={{ fontWeight: '700' }}>₮{loan.amount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Хүү ({loan.interest_rate || 0}%):</span>
            <span style={{ fontWeight: '700' }}>₮{interest.toLocaleString()}</span>
          </div>
          <div style={{ height: '1px', background: 'var(--line)', margin: '16px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '700' }}>Нийт дүн:</span>
            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary)' }}>
              ₮{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{
          padding: '12px',
          background: remaining > 0 ? '#DFFFD8' : '#E0E7FF',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: remaining > 0 ? '#10b981' : '#4f46e5' }}>
            {remaining > 0 ? `Сарын төлбөр: ₮${monthlyPayment.toLocaleString()}` : 'Зээл бүрэн төлөгдсөн'}
          </p>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          <p><strong>Үлдэгдэл:</strong> ₮{remaining.toLocaleString()}</p>
          <p><strong>Төлөгдсөн:</strong> ₮{paidAmount.toLocaleString()}</p>
          <p><strong>Хугацаа:</strong> {termMonths} сар</p>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="payment-container">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="payment-container">
        <h1 style={{ marginBottom: '8px' }}>Төлбөр төлөх</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Зээлээ сонгоод төлбөр төлөх боломжтой
        </p>

        <div className="payment-grid">
          <div>
            <div className="card">
              <div className="card-header">
                <h3>Төлбөрийн арга сонгох</h3>
              </div>
              <div className="card-body">
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Wallet үлдэгдэл</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                        ₮{walletBalance.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ fontSize: '32px' }}></div>
                  </div>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  padding: '16px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '20px'
                }}>
                  <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                    <strong>Зээлийн төлбөр:</strong> Зээлийн төлбөр зөвхөн Wallet-ээс төлөгдөнө. Wallet-д мөнгө нэмэхийн тулд Dashboard-аас "Мөнгө нэмэх" товч дарна уу.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label required">Зээл сонгох</label>
                    <select
                      id="loanSelect"
                      className="form-control"
                      value={selectedLoanId || ''}
                      onChange={handleLoanChange}
                      required
                    >
                      {allLoans.length === 0 ? (
                        <option value="">Идэвхтэй зээл байхгүй байна</option>
                      ) : (
                        <>
                          <option value="">Зээл сонгох...</option>
                          {allLoans.map(loan => {
                            const totalAmount = loan.total_amount || loan.amount;
                            const remaining = totalAmount - (loan.paid_amount || 0);
                            return (
                              <option key={loan.id} value={loan.id}>
                                Зээл #{loan.id} - Үлдэгдэл: ₮{remaining.toLocaleString()}
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Төлбөрийн дүн</label>
                    <div className="number-display">
                      <span className="currency">₮</span>
                      <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value))}
                        min="1000"
                        required
                      />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Доод дүн: ₮1,000
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block btn-lg"
                    disabled={isSubmitting || !selectedLoanId}
                  >
                    {isSubmitting ? 'Төлбөр боловсруулж байна...' : 'Wallet-ээс төлөх'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <h3>Нэхэмжлэх</h3>
              </div>
              <div className="card-body">
                {renderInvoice()}
              </div>
            </div>

            <div className="card" style={{ marginTop: '16px', background: 'var(--gradient-soft)' }}>
              <div className="card-body">
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Санал</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Эрт төлвөл үлдсэн хүүг төлөх шаардлагагүй.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
