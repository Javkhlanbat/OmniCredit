import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/purchase-loan.css';
import { LoansAPI } from '../services/api';
import TokenManager from '../services/auth';

export default function PurchaseLoan() {
  const navigate = useNavigate();
  const [invoiceCode, setInvoiceCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvoiceCodeChange = (e) => {
    setInvoiceCode(e.target.value.toUpperCase());
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 8);
    setPhoneNumber(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!TokenManager.isAuthenticated()) {
      if (window.confirm('Зээл авахын тулд нэвтрэх хэрэгтэй. Нэвтрэх хуудас руу шилжих үү?')) {
        navigate('/login');
      }
      return;
    }

    if (!invoiceCode || !phoneNumber) {
      alert('Бүх талбарыг бөглөнө үү');
      return;
    }

    try {
      setIsSubmitting(true);

      await LoansAPI.applyForPurchaseLoan({
        invoice_code: invoiceCode,
        phone: phoneNumber,
        merchant_name: 'Demo Merchant',
        amount: 0
      });

      alert('Амжилттай баталгаажлаа!');
      setTimeout(() => {
        navigate('/my-loans');
      }, 1500);
    } catch (error) {
      console.error('Purchase loan error:', error);
      alert('Алдаа гарлаа: ' + (error.message || ''));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div style={{
        background: 'linear-gradient(135deg, #E0F7FA 0%, #E8F5E9 100%)',
        padding: '24px',
        borderRadius: '16px',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.7)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#0d9488',
            letterSpacing: '0.5px'
          }}>
            ТООЦООЛУУР
          </span>
        </div>
        <h2 style={{
          margin: 0,
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Зээлийн нөхцөл харах ба баталгаажуулах
        </h2>
      </div>

      <div className="loan-type-tabs">
        <Link to="/zeelhuudas" className="btn btn-secondary">Хэрэглээний зээл</Link>
        <Link to="/purchase-loan" className="btn btn-primary">Худалдан авалтын зээл</Link>
      </div>

      <div className="loan-content">
        <div className="info-box">
          <h3>Худалдан авалтын зээл (0% хүү, урьдчилгаагүй)</h3>
          <p>
            Хамтрагч байгууллагаас авсан <strong>нэхэмжлэлийн код</strong>-оо оруулж баталгаажуулна.
          </p>
        </div>

        <div className="validation-form">
          <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>
            Худалдан авалтын зээл (0% хүү, урьдчилгаагүй)
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="invoiceCode">Нэхэмжлэлийн код</label>
              <input
                type="text"
                id="invoiceCode"
                value={invoiceCode}
                onChange={handleInvoiceCodeChange}
                placeholder="AA12-BC34-5678"
                pattern="[A-Z0-9\-]+"
                required
              />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Хамтрагч байгууллагаас авсан нэхэмжлэлийн код шаардлагатай
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Утасны дугаар</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="99xxxxxx"
                pattern="[0-9]{8}"
                maxLength="8"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Баталгаажуулж байна...' : 'Илгээх'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
