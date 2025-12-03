import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/my-loans.css';
import { LoansAPI } from '../services/api';
import TokenManager from '../services/auth';

export default function MyLoans() {
  const navigate = useNavigate();
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadLoans();
  }, [navigate]);

  useEffect(() => {
    filterLoans();
  }, [currentFilter, allLoans]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await LoansAPI.getMyLoans();
      console.log('Loans response:', response);

      const loans = Array.isArray(response) ? response : (response.loans || []);
      setAllLoans(loans);
      setLoading(false);
    } catch (err) {
      console.error('Load loans error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const filterLoans = () => {
    if (currentFilter === 'all') {
      setFilteredLoans(allLoans);
    } else {
      setFilteredLoans(allLoans.filter(loan => loan.status === currentFilter));
    }
  };

  const handleFilterClick = (filter) => {
    setCurrentFilter(filter);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': { label: 'Хүлээгдэж буй', class: 'status-pending' },
      'approved': { label: 'Баталгаажсан', class: 'status-active' },
      'disbursed': { label: 'Олгогдсон', class: 'status-disbursed' },
      'active': { label: 'Идэвхтэй', class: 'status-active' },
      'paid': { label: 'Төлөгдсөн', class: 'status-paid' },
      'rejected': { label: 'Татгалзсан', class: 'status-rejected' },
      'cancelled': { label: 'Цуцлагдсан', class: 'status-cancelled' }
    };
    return statusMap[status] || { label: status, class: 'status-pending' };
  };

  const renderLoanCard = (loan) => {
    const statusInfo = getStatusInfo(loan.status);
    const paidAmount = loan.paid_amount || 0;
    const remaining = loan.amount - paidAmount;
    const progress = loan.amount > 0 ? ((paidAmount / loan.amount) * 100).toFixed(0) : 0;
    const termMonths = loan.term_months || loan.term || 12;
    const monthlyPayment = loan.monthly_payment || Math.round(loan.amount / termMonths);
    const createdDate = new Date(loan.created_at).toLocaleDateString('mn-MN');

    if (loan.status === 'pending') {
      return (
        <div key={loan.id} className="loan-card" data-status={loan.status}>
          <div className="loan-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h4>Зээл #{loan.id}</h4>
              <span className={`loan-status ${statusInfo.class}`}>{statusInfo.label}</span>
            </div>

            <div className="loan-meta">
              <div className="loan-meta-item">
                <span className="loan-meta-label">Хүсэлтийн дүн</span>
                <span className="loan-meta-value">₮{loan.amount.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Хугацаа</span>
                <span className="loan-meta-value">{termMonths} сар</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Хүсэлтийн огноо</span>
                <span className="loan-meta-value">{createdDate}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Зориулалт</span>
                <span className="loan-meta-value">{loan.purpose || '-'}</span>
              </div>
            </div>

            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Таны хүсэлтийг шалгаж байна. 24 цагийн дотор хариу өгнө.
            </p>
          </div>

          <div className="loan-actions">
            <button className="btn btn-secondary" disabled>Дэлгэрэнгүй</button>
          </div>
        </div>
      );
    } else if (loan.status === 'disbursed') {
      return (
        <div key={loan.id} className="loan-card" data-status={loan.status}>
          <div className="loan-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h4>Зээл #{loan.id}</h4>
              <span className={`loan-status ${statusInfo.class}`}>{statusInfo.label}</span>
            </div>

            <div className="loan-meta">
              <div className="loan-meta-item">
                <span className="loan-meta-label">Зээлийн дүн</span>
                <span className="loan-meta-value">₮{loan.amount.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Үлдэгдэл</span>
                <span className="loan-meta-value">₮{remaining.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Сарын төлбөр</span>
                <span className="loan-meta-value">₮{monthlyPayment.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Хугацаа</span>
                <span className="loan-meta-value">{termMonths} сар</span>
              </div>
            </div>

            <p style={{ marginTop: '12px', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
              Зээл таны дансанд шилжүүлэгдсэн байна!
            </p>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {progress}% төлөгдсөн
            </p>
          </div>

          <div className="loan-actions">
            <Link to={`/payment?loan=${loan.id}`} className="btn btn-primary">Төлбөр төлөх</Link>
            <button className="btn btn-secondary" disabled>Дэлгэрэнгүй</button>
          </div>
        </div>
      );
    } else if (loan.status === 'paid') {
      return (
        <div key={loan.id} className="loan-card" data-status={loan.status}>
          <div className="loan-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h4>Зээл #{loan.id}</h4>
              <span className={`loan-status ${statusInfo.class}`}>{statusInfo.label}</span>
            </div>

            <div className="loan-meta">
              <div className="loan-meta-item">
                <span className="loan-meta-label">Зээлийн дүн</span>
                <span className="loan-meta-value">₮{loan.amount.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Төлсөн</span>
                <span className="loan-meta-value">₮{paidAmount.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Эхэлсэн</span>
                <span className="loan-meta-value">{createdDate}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Хугацаа</span>
                <span className="loan-meta-value">{termMonths} сар</span>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '100%' }}></div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Бүрэн төлөгдсөн
            </p>
          </div>

          <div className="loan-actions">
            <button className="btn btn-secondary" disabled>Баримт харах</button>
          </div>
        </div>
      );
    } else {
      // Active or approved loans
      return (
        <div key={loan.id} className="loan-card" data-status={loan.status}>
          <div className="loan-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h4>Зээл #{loan.id}</h4>
              <span className={`loan-status ${statusInfo.class}`}>{statusInfo.label}</span>
            </div>

            <div className="loan-meta">
              <div className="loan-meta-item">
                <span className="loan-meta-label">Зээлийн дүн</span>
                <span className="loan-meta-value">₮{loan.amount.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Үлдэгдэл</span>
                <span className="loan-meta-value">₮{remaining.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Сарын төлбөр</span>
                <span className="loan-meta-value">₮{monthlyPayment.toLocaleString()}</span>
              </div>
              <div className="loan-meta-item">
                <span className="loan-meta-label">Хугацаа</span>
                <span className="loan-meta-value">{termMonths} сар</span>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {progress}% төлөгдсөн
            </p>
          </div>

          <div className="loan-actions">
            <Link to={`/payment?loan=${loan.id}`} className="btn btn-primary">Төлбөр төлөх</Link>
            <button className="btn btn-secondary" disabled>Дэлгэрэнгүй</button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Миний зээл</h1>
        <p style={{ color: 'var(--text-muted)' }}>Таны бүх зээлийн мэдээлэл</p>
      </div>

      <div className="loan-filters">
        <button
          className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          Бүгд
        </button>
        <button
          className={`filter-btn ${currentFilter === 'disbursed' ? 'active' : ''}`}
          onClick={() => handleFilterClick('disbursed')}
        >
          Олгогдсон
        </button>
        <button
          className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
          onClick={() => handleFilterClick('active')}
        >
          Идэвхтэй
        </button>
        <button
          className={`filter-btn ${currentFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleFilterClick('pending')}
        >
          Хүлээгдэж буй
        </button>
        <button
          className={`filter-btn ${currentFilter === 'paid' ? 'active' : ''}`}
          onClick={() => handleFilterClick('paid')}
        >
          Төлсөн
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Ачаалж байна...</p>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <p style={{ color: '#EF4444' }}>Алдаа: {error}</p>
          <button onClick={loadLoans} className="btn btn-primary" style={{ marginTop: '16px' }}>
            Дахин оролдох
          </button>
        </div>
      )}

      {!loading && !error && allLoans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
          <h3>Зээл байхгүй байна</h3>
          <p style={{ color: 'var(--text-muted)', margin: '16px 0 24px' }}>
            Та одоогоор ямар ч зээл аваагүй байна
          </p>
          <Link to="/application" className="btn btn-primary btn-lg">
            Зээл авах
          </Link>
        </div>
      )}

      {!loading && !error && allLoans.length > 0 && (
        <div>
          {filteredLoans.map(loan => renderLoanCard(loan))}
        </div>
      )}

      {!loading && !error && allLoans.length > 0 && (
        <div className="card card-peachy" style={{ marginTop: '48px', marginBottom: '80px', padding: '48px', textAlign: 'center' }}>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>Шинэ зээл авах уу?</h3>
          <p style={{ color: 'white', opacity: 0.95, marginBottom: '24px' }}>
            Зээлийн түүх сайн байгаа тул та илүү их дүн, илүү хямд хүүтэй зээл авах боломжтой
          </p>
          <Link to="/application" className="btn btn-secondary btn-lg" style={{ background: 'white', color: 'var(--primary)' }}>
            Шинэ зээл авах
          </Link>
        </div>
      )}
    </div>
  );
}
