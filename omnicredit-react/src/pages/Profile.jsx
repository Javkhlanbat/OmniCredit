import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TokenManager, UserManager, AuthAPI, WalletAPI, LoansAPI } from '../services/api';
import { showToast } from '../services/utils';
import '../styles/profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);
  const [totalLoanAmount, setTotalLoanAmount] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    registerId: ''
  });

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadProfile();
    loadWallet();
    loadLoans();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const profile = await AuthAPI.getProfile();
      setUser(profile);
      setFormData({
        lastName: profile.last_name || '',
        firstName: profile.first_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        registerId: profile.register_id || ''
      });
    } catch (error) {
      console.error('Load profile error:', error);
      showToast('Профайл уншихад алдаа гарлаа', 'error');
    }
  };

  const loadWallet = async () => {
    try {
      const response = await WalletAPI.getMyWallet();
      setWalletBalance(parseFloat(response.wallet.balance) || 0);

      const txResponse = await WalletAPI.getWalletTransactions();
      setWalletTransactions(txResponse.transactions || []);
    } catch (error) {
      console.error('Load wallet error:', error);
    }
  };

  const loadLoans = async () => {
    try {
      const response = await LoansAPI.getMyLoans();
      const loans = Array.isArray(response) ? response : (response.loans || []);

      const active = loans.filter(loan =>
        loan.status === 'disbursed' || loan.status === 'active' || loan.status === 'approved'
      );

      setActiveLoansCount(active.length);

      const total = active.reduce((sum, loan) => sum + loan.amount, 0);
      setTotalLoanAmount(total);
    } catch (error) {
      console.error('Load loans error:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      await AuthAPI.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      });

      showToast('Профайл амжилттай шинэчлэгдлээ!', 'success');
    } catch (error) {
      console.error('Update profile error:', error);
      showToast(error.message || 'Профайл шинэчлэхэд алдаа гарлаа', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getInitials = () => {
    if (!user) return '--';
    const first = (user.first_name || '')[0] || '';
    const last = (user.last_name || '')[0] || '';
    return (first + last).toUpperCase() || '—';
  };

  return (
    <div className="container">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{getInitials()}</span>
            <div className="avatar-upload-overlay">Зураг солих</div>
          </div>
          <div>
            <h1 style={{ marginBottom: '8px' }}>
              {user ? `${user.last_name || ''} ${user.first_name || ''}`.trim() || 'Хэрэглэгч' : 'Уншиж байна...'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
              {user ? user.email : '--'}
            </p>
            <span style={{ padding: '6px 12px', background: 'white', borderRadius: '999px', fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
              Баталгаажсан
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
              ₮{walletBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Wallet үлдэгдэл</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
              {activeLoansCount}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Идэвхтэй зээл</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
              ₮{totalLoanAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Нийт зээлийн дүн</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
            Хувийн мэдээлэл
          </button>
          <button className={`tab ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
            Wallet
          </button>
          <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            Нууцлал
          </button>
          <button className={`tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
            Тохиргоо
          </button>
        </div>

        {/* Personal Tab */}
        <div className={`tab-content ${activeTab === 'personal' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <h3>Хувийн мэдээлэл</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Овог</label>
                    <input
                      type="text"
                      name="lastName"
                      className="form-control"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Нэр</label>
                    <input
                      type="text"
                      name="firstName"
                      className="form-control"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Имэйл хаяг</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Утасны дугаар</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Регистр</label>
                  <input
                    type="text"
                    name="registerId"
                    className="form-control"
                    value={formData.registerId}
                    disabled
                  />
                </div>

                <button type="submit" className="btn btn-primary">Хадгалах</button>
              </form>
            </div>
          </div>
        </div>

        {/* Wallet Tab */}
        <div className={`tab-content ${activeTab === 'wallet' ? 'active' : ''}`}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', marginBottom: '24px' }}>
            <div className="card-body" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '14px' }}>Миний Wallet үлдэгдэл</p>
                  <h2 style={{ color: 'white', fontSize: '2.5rem', margin: 0 }}>
                    ₮{walletBalance.toLocaleString()}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link to="/dashboard" className="btn" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}>
                    Dashboard руу
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Сүүлийн гүйлгээ</h3>
            </div>
            <div className="card-body">
              {walletTransactions.length > 0 ? (
                walletTransactions.slice(0, 5).map((tx, index) => (
                  <div key={tx.id || index} style={{
                    padding: '16px 0',
                    borderBottom: index < walletTransactions.length - 1 ? '1px solid var(--line)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                          {tx.type === 'deposit' ? 'Орлого' : 'Зарлага'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {new Date(tx.created_at).toLocaleDateString('mn-MN')}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: '800',
                        fontSize: '1.125rem',
                        color: tx.type === 'deposit' ? '#10b981' : '#ef4444'
                      }}>
                        {tx.type === 'deposit' ? '+' : '-'}₮{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <p>Гүйлгээ байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Tab */}
        <div className={`tab-content ${activeTab === 'security' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <h3>Нууц үг солих</h3>
            </div>
            <div className="card-body">
              <form>
                <div className="form-group">
                  <label className="form-label">Одоогийн нууц үг</label>
                  <input type="password" className="form-control" placeholder="••••••••" />
                </div>

                <div className="form-group">
                  <label className="form-label">Шинэ нууц үг</label>
                  <input type="password" className="form-control" placeholder="••••••••" />
                </div>

                <div className="form-group">
                  <label className="form-label">Шинэ нууц үг давтах</label>
                  <input type="password" className="form-control" placeholder="••••••••" />
                </div>

                <button type="submit" className="btn btn-primary">Солих</button>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h3>Хоёр хүчин зүйлийн баталгаажуулалт</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ marginBottom: '4px' }}>SMS баталгаажуулалт</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                    Нэвтрэх үед SMS код шаардах
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ marginRight: '8px' }} />
                  <span>Идэвхжүүлэх</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Tab */}
        <div className={`tab-content ${activeTab === 'preferences' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <h3>Мэдэгдлийн тохиргоо</h3>
            </div>
            <div className="card-body">
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ marginBottom: '4px' }}>Имэйл мэдэгдэл</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                      Төлбөрийн сануулга, шинэ санал
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>

              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ marginBottom: '4px' }}>SMS мэдэгдэл</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                      Төлбөрийн сануулга, хүлээн авалт
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>

              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ marginBottom: '4px' }}>Маркетингийн мэдээлэл</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                      Хөнгөлөлт, урамшуулал
                    </p>
                  </div>
                  <input type="checkbox" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Хадгалах</button>
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px', border: '2px solid #FFE5E5' }}>
            <div className="card-body">
              <h4 style={{ color: '#EF4444', marginBottom: '12px' }}>Данс устгах</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                Таны бүх мэдээлэл устгагдах бөгөөд энэ үйлдлийг буцаах боломжгүй.
              </p>
              <button className="btn btn-ghost" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                Данс устгах
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
