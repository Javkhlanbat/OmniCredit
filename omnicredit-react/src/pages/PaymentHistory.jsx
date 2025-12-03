import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TokenManager, PaymentsAPI } from '../services/api';
import { showToast } from '../services/utils';
import '../styles/payment-history.css';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPayments: 0,
    successfulPayments: 0
  });

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadPayments();
  }, [navigate]);

  useEffect(() => {
    filterPaymentsByStatus();
  }, [filterStatus, payments]);

  const loadPayments = async () => {
    try {
      const response = await PaymentsAPI.getMyPayments();
      const paymentList = response || [];
      setPayments(paymentList);

      // Calculate summary
      const totalPaid = paymentList.reduce((sum, p) => sum + p.amount, 0);
      const successfulPayments = paymentList.filter(p => p.status === 'completed' || p.status === 'success').length;

      setSummary({
        totalPaid,
        totalPayments: paymentList.length,
        successfulPayments
      });
    } catch (error) {
      console.error('Load payments error:', error);
      showToast('Төлбөрийн түүх уншихад алдаа гарлаа', 'error');
    }
  };

  const filterPaymentsByStatus = () => {
    if (filterStatus === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(p => getPaymentStatus(p.status) === filterStatus));
    }
  };

  const getPaymentStatus = (status) => {
    if (status === 'completed' || status === 'success' || status === 'paid') return 'success';
    if (status === 'pending' || status === 'processing') return 'pending';
    if (status === 'failed' || status === 'cancelled') return 'failed';
    return 'success';
  };

  const getPaymentIcon = (method) => {
    if (method === 'card') return '';
    if (method === 'qpay') return '';
    if (method === 'social' || method === 'socialpay') return '';
    if (method === 'bank') return '';
    return '';
  };

  const getPaymentMethodLabel = (method) => {
    if (method === 'card') return 'Картаар';
    if (method === 'qpay') return 'QPay';
    if (method === 'social' || method === 'socialpay') return 'SocialPay';
    if (method === 'bank') return 'Банк';
    return 'Шилжүүлэг';
  };

  const getStatusLabel = (status) => {
    const statusType = getPaymentStatus(status);
    if (statusType === 'success') return 'Амжилттай';
    if (statusType === 'pending') return 'Хүлээгдэж байна';
    if (statusType === 'failed') return 'Амжилтгүй';
    return 'Амжилттай';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Төлбөрийн түүх</h1>
        <p style={{ color: 'var(--text-muted)' }}>Таны бүх төлбөрийн түүх</p>
      </div>

      <div className="summary-card">
        <h2 style={{ marginBottom: '8px' }}>Нийт төлсөн</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <h4>₮{summary.totalPaid.toLocaleString()}</h4>
            <p>Нийт төлбөр</p>
          </div>
          <div className="summary-item">
            <h4>{summary.totalPayments}</h4>
            <p>Төлбөрийн тоо</p>
          </div>
          <div className="summary-item">
            <h4>{summary.successfulPayments}</h4>
            <p>Амжилттай төлбөр</p>
          </div>
        </div>
      </div>

      <div className="filters">
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Бүгд</option>
          <option value="success">Амжилттай</option>
          <option value="pending">Хүлээгдэж байна</option>
          <option value="failed">Амжилтгүй</option>
        </select>
      </div>

      <div className="payment-list">
        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => {
            const statusType = getPaymentStatus(payment.status);
            const date = new Date(payment.payment_date || payment.created_at);
            const formattedDate = date.toLocaleDateString('mn-MN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={payment.id} className="payment-item">
                <div className="payment-info">
                  <div className={`payment-icon ${statusType}`}>
                    {getPaymentIcon(payment.payment_method)}
                  </div>
                  <div className="payment-details">
                    <h4>{getPaymentMethodLabel(payment.payment_method)}</h4>
                    <div className="payment-date">{formattedDate}</div>
                  </div>
                </div>
                <div className="payment-amount">
                  <div className={`amount ${statusType}`}>
                    ₮{payment.amount.toLocaleString()}
                  </div>
                  <div className={`payment-status status-${statusType}`}>
                    {getStatusLabel(payment.status)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
            <h3>Төлбөр байхгүй байна</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
              Та одоогоор төлбөр хийгээгүй байна
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
