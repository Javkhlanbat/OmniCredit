import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserManager, LoansAPI, PaymentsAPI, WalletAPI, AuthAPI } from '../services/api';
import { showToast } from '../services/utils';
import '../styles/cards.css';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [stats, setStats] = useState({
    activeLoansCount: 0,
    totalBalance: 0,
    nextPayment: 0,
    daysUntilPayment: '-'
  });
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadDashboard();
    loadWallet();
  }, []);

  const loadDashboard = async () => {
    try {
      const currentUser = UserManager.getUser();
      if (currentUser) {
        setUser(currentUser);
      }

      const response = await LoansAPI.getMyLoans();
      const loans = Array.isArray(response) ? response : (response.loans || []);

      if (loans && loans.length > 0) {
        const active = loans.filter(loan =>
          loan.status === 'disbursed' || loan.status === 'active' || loan.status === 'approved'
        );

        setActiveLoans(active);

        let totalBalance = 0;
        let nextPayment = 0;

        active.forEach(loan => {
          const remaining = loan.amount - (loan.paid_amount || 0);
          totalBalance += remaining;

          const monthlyPayment = loan.monthly_payment || (loan.amount / (loan.term_months || loan.term || 12));
          if (monthlyPayment > nextPayment) {
            nextPayment = monthlyPayment;
          }
        });

        setStats({
          activeLoansCount: active.length,
          totalBalance: Math.round(totalBalance),
          nextPayment: Math.round(nextPayment),
          daysUntilPayment: '-'
        });
      }

      await loadRecentPayments();

    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  };

  const loadRecentPayments = async () => {
    try {
      const payments = await PaymentsAPI.getMyPayments();
      if (payments && payments.length > 0) {
        setRecentPayments(payments.slice(0, 3));
      }
    } catch (error) {
      console.error('Load payments error:', error);
    }
  };

  const loadWallet = async () => {
    try {
      const response = await WalletAPI.getMyWallet();
      const wallet = response.wallet;
      setWalletBalance(parseFloat(wallet.balance) || 0);
    } catch (error) {
      console.error('Load wallet error:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Гарахдаа итгэлтэй байна уу?')) {
      AuthAPI.logout();
    }
  };

  const openDepositModal = () => {
    setDepositModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDepositModal = () => {
    setDepositModalOpen(false);
    document.body.style.overflow = '';
    setDepositAmount('');
  };

  const openWithdrawModal = () => {
    setWithdrawModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeWithdrawModal = () => {
    setWithdrawModalOpen(false);
    document.body.style.overflow = '';
    setWithdrawAmount('');
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);

    if (amount < 1000) {
      showToast('Хамгийн багадаа ₮1,000 нэмэх боломжтой', 'error');
      return;
    }

    try {
      await WalletAPI.depositToWallet({ amount, payment_method: 'qpay' });
      showToast('Wallet руу амжилттай нэмэгдлээ!', 'success');
      closeDepositModal();
      await loadWallet();
    } catch (error) {
      console.error('Deposit error:', error);
      showToast(error.message || 'Мөнгө нэмэхэд алдаа гарлаа', 'error');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (amount > walletBalance) {
      showToast('Үлдэгдэл хүрэлцэхгүй байна', 'error');
      return;
    }

    if (amount < 1000) {
      showToast('Хамгийн багадаа ₮1,000 шилжүүлэх боломжтой', 'error');
      return;
    }

    try {
      await WalletAPI.withdrawToBank({ amount, payment_method: 'qpay' });
      showToast('QPay шилжүүлэг амжилттай!', 'success');
      closeWithdrawModal();
      await loadWallet();
    } catch (error) {
      console.error('Withdraw error:', error);
      showToast(error.message || 'Шилжүүлэхэд алдаа гарлаа', 'error');
    }
  };

  const userName = user ? (user.first_name || user.firstName || 'Хэрэглэгч') : 'Хэрэглэгч';

  return (
    <div className="container">
      <div style={{ margin: '48px 0 32px' }}>
        <h1 id="welcomeMessage">Сайн байна уу, {userName}!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Таны санхүүгийн тойм</p>
      </div>

      <div className="dashboard-grid">
        <div className="stats-card">
          <div className="stats-card-value">{stats.activeLoansCount}</div>
          <div className="stats-card-label">Идэвхтэй зээл</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">₮{stats.totalBalance.toLocaleString()}</div>
          <div className="stats-card-label">Үлдэгдэл</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">₮{stats.nextPayment.toLocaleString()}</div>
          <div className="stats-card-label">Дараагийн төлбөр</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.daysUntilPayment}</div>
          <div className="stats-card-label">Төлбөрийн хугацаа</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '14px' }}>Миний Wallet</p>
              <h2 style={{ color: 'white', fontSize: '2.5rem', margin: 0 }}>₮{walletBalance.toLocaleString()}</h2>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={openDepositModal}>
                Мөнгө нэмэх
              </button>
              <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={openWithdrawModal}>
                QPay шилжүүлэг
              </button>
              <Link to="/wallet-history" className="btn btn-secondary" style={{ background: 'white', color: '#667eea' }}>
                Түүх харах
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/payment" className="action-card">
          <div className="action-icon"></div>
          <h4>Төлбөр төлөх</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Сарын төлбөр төлөх</p>
        </Link>

        <Link to="/application-new" className="action-card">
          <div className="action-icon"></div>
          <h4>Зээл авах</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Шинэ зээл хүсэх</p>
        </Link>

        <Link to="/paymenthistory" className="action-card">
          <div className="action-icon"></div>
          <h4>Түүх</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Төлбөрийн түүх харах</p>
        </Link>
      </div>

      {depositModalOpen && (
        <div
          id="depositModal"
          style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => {
            if (e.target.id === 'depositModal') closeDepositModal();
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '90%', margin: '20px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Wallet руу мөнгө нэмэх</h3>
              <button onClick={closeDepositModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px' }}>Одоогийн үлдэгдэл</p>
                <h2 style={{ color: 'white', margin: 0, fontSize: '2rem' }}>₮{walletBalance.toLocaleString()}</h2>
              </div>
              <form onSubmit={handleDeposit}>
                <div className="form-group">
                  <label className="form-label">Нэмэх дүн</label>
                  <input type="number" className="form-control" placeholder="10000" min="1000" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Доод дүн: ₮1,000</p>
                </div>
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                    <strong>QPay-ээр төлөх:</strong> Төлбөр баталгаажсаны дараа wallet-д автоматаар орно.
                  </p>
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg">QPay-ээр төлөх</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {withdrawModalOpen && (
        <div
          id="withdrawModal"
          style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => {
            if (e.target.id === 'withdrawModal') closeWithdrawModal();
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '90%', margin: '20px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>QPay шилжүүлэг</h3>
              <button onClick={closeWithdrawModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px' }}>Боломжит үлдэгдэл</p>
                <h2 style={{ color: 'white', margin: 0, fontSize: '2rem' }}>₮{walletBalance.toLocaleString()}</h2>
              </div>
              <form onSubmit={handleWithdraw}>
                <div className="form-group">
                  <label className="form-label">Шилжүүлэх дүн</label>
                  <input type="number" className="form-control" placeholder="10000" min="1000" required value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Доод дүн: ₮1,000</p>
                </div>
                <div style={{ background: '#fef3c7', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                    <strong>QPay шилжүүлэг:</strong> Та өөрийн QPay бүртгэлтэй дансруу шилжүүлэг хийнэ.
                  </p>
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg">QPay-ээр шилжүүлэх</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeLoans.length > 0 ? (
        <div className="recent-section" style={{ marginTop: '48px' }}>
          <h2 style={{ marginBottom: '24px' }}>Идэвхтэй зээл</h2>
          {activeLoans.map(loan => {
            const paidAmount = loan.paid_amount || 0;
            const remaining = loan.amount - paidAmount;
            const progress = (paidAmount / loan.amount * 100).toFixed(0);
            const createdDate = new Date(loan.created_at).toLocaleDateString('mn-MN');
            const termMonths = loan.term_months || loan.term || 12;
            const monthlyPayment = loan.monthly_payment || Math.round(loan.amount / termMonths);

            const statusInfo = {
              'disbursed': { label: 'ОЛГОГДСОН', bg: '#D1FAE5', color: '#059669' },
              'active': { label: 'ИДЭВХТЭЙ', bg: '#DFFFD8', color: '#10b981' },
              'approved': { label: 'ЗӨВШӨӨРӨГДСӨН', bg: '#DFFFD8', color: '#10b981' }
            }[loan.status] || { label: loan.status.toUpperCase(), bg: '#E5E7EB', color: '#6B7280' };

            return (
              <div key={loan.id} className="card" style={{ marginBottom: '16px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h3>Зээл #{loan.id}</h3>
                      <p style={{ color: 'var(--text-muted)', margin: '4px 0' }}>Үүсгэсэн: {createdDate}</p>
                    </div>
                    <span style={{ padding: '6px 12px', background: statusInfo.bg, color: statusInfo.color, borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>{statusInfo.label}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', margin: '24px 0' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Зээлийн дүн</div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>₮{loan.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Сарын төлбөр</div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>₮{monthlyPayment.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Үлдэгдэл</div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>₮{remaining.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Хугацаа</div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{termMonths} сар</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--line)', height: '8px', borderRadius: '999px', overflow: 'hidden', margin: '16px 0' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient-peachy)' }}></div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {progress}% төлөгдсөн
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <Link to={`/payment?loan=${loan.id}`} className="btn btn-primary">Төлбөр төлөх</Link>
                    <Link to="/my-loans" className="btn btn-secondary">Дэлгэрэнгүй</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="recent-section" style={{ marginTop: '48px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <h3>Зээл байхгүй байна</h3>
            <p style={{ color: 'var(--text-muted)', margin: '16px 0 24px' }}>
              Та одоогоор ямар ч зээл аваагүй байна
            </p>
            <Link to="/application-new" className="btn btn-primary btn-lg">
              Зээл авах
            </Link>
          </div>
        </div>
      )}

      <div className="recent-section">
        <h2 style={{ marginBottom: '24px' }}>Сүүлийн гүйлгээ</h2>
        <div className="card">
          <div className="card-body">
            {recentPayments.length > 0 ? (
              <>
                {recentPayments.map((payment, index) => {
                  const date = new Date(payment.payment_date || payment.created_at);
                  const formattedDate = date.toLocaleDateString('mn-MN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });

                  const borderStyle = index < recentPayments.length - 1
                    ? { borderBottom: '1px solid var(--line)' }
                    : {};

                  return (
                    <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', ...borderStyle }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                          {payment.payment_method === 'card' ? 'Картаар' :
                            payment.payment_method === 'qpay' ? 'QPay' :
                            payment.payment_method === 'social' ? 'SocialPay' : 'Шилжүүлэг'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formattedDate}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#10b981' }}>
                        -₮{payment.amount.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
                <Link to="/paymenthistory" className="btn btn-secondary btn-block" style={{ marginTop: '16px' }}>
                  Бүх түүх харах
                </Link>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <p>Төлбөрийн түүх байхгүй байна</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ margin: '64px 0 80px' }}>
        <div className="card card-peachy" style={{ padding: '48px', textAlign: 'center' }}>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>Тусламж хэрэгтэй юу?</h3>
          <p style={{ color: 'white', opacity: 0.95, marginBottom: '24px' }}>
            Бидний дэмжлэгийн баг танд туслахад бэлэн байна
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/faq" className="btn btn-secondary" style={{ background: 'white', color: 'var(--primary)' }}>FAQ харах</Link>
            <a href="mailto:support@omnicredit.mn" className="btn btn-ghost" style={{ borderColor: 'white', color: 'white' }}>Холбогдох</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
