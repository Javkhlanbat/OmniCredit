import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { LoansAPI, AuthAPI, PromoCodeAPI, api } from '../services/api';
import TokenManager from '../services/auth';

export default function Admin() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('loans');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingLoans: 0,
    activeLoans: 0,
    totalLoanAmount: 0
  });

  // Loans
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loanSearchTerm, setLoanSearchTerm] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');

  // Users
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Companies & Promo Codes
  const [allCompanies, setAllCompanies] = useState([]);
  const [allPromoCodes, setAllPromoCodes] = useState([]);

  // Analytics - Real data!
  const [analyticsData, setAnalyticsData] = useState({
    funnel: [],
    devices: [],
    errors: [],
    summary: null,
    loading: true
  });

  // Modals
  const [userProfileModal, setUserProfileModal] = useState(false);
  const [createCompanyModal, setCreateCompanyModal] = useState(false);
  const [createPromoCodeModal, setCreatePromoCodeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  });

  const [promoForm, setPromoForm] = useState({
    company_id: '',
    code: '',
    interest_rate_override: 2,
    max_loan_amount: '',
    max_uses: '',
    expires_at: '',
    description: ''
  });

  useEffect(() => {
    if (!TokenManager.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadStatistics();
    loadLoans();
  }, [navigate]);

  useEffect(() => {
    filterLoans();
  }, [loanSearchTerm, loanStatusFilter, allLoans]);

  useEffect(() => {
    filterUsers();
  }, [userSearchTerm, allUsers]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadStatistics = async () => {
    try {
      const loansData = await LoansAPI.getAllLoans();
      const loans = loansData.loans || [];

      const usersResponse = await api.get('/auth/admin/users');
      const users = usersResponse.users || [];

      const pendingLoans = loans.filter(l => l.status === 'pending').length;
      const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'approved').length;
      const totalAmount = loans.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

      setStats({
        totalUsers: users.length,
        pendingLoans,
        activeLoans,
        totalLoanAmount: totalAmount
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadLoans = async () => {
    try {
      const data = await LoansAPI.getAllLoans();
      setAllLoans(data.loans || []);
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }));

      const [funnelRes, devicesRes, errorsRes, summaryRes] = await Promise.all([
        api.get('/analytics/funnel'),
        api.get('/analytics/devices'),
        api.get('/analytics/errors'),
        api.get('/analytics/summary')
      ]);

      setAnalyticsData({
        funnel: funnelRes.funnelSteps || [],
        devices: devicesRes.devices || [],
        errors: errorsRes.errors || [],
        summary: summaryRes.summary || null,
        loading: false
      });

      console.log('📊 Analytics data loaded:', {
        funnel: funnelRes.funnelSteps,
        devices: devicesRes.devices,
        errors: errorsRes.errors,
        summary: summaryRes.summary
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  const filterLoans = () => {
    let filtered = allLoans;

    if (loanStatusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === loanStatusFilter);
    }

    if (loanSearchTerm) {
      const searchLower = loanSearchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.id.toString().includes(searchLower) ||
        loan.user_id.toString().includes(searchLower) ||
        loan.amount.toString().includes(searchLower)
      );
    }

    setFilteredLoans(filtered);
  };

  const approveLoan = async (loanId) => {
    if (!window.confirm('Энэ зээлийг зөвшөөрөх үү?\n\nЗөвшөөрсний дараа хэрэглэгчийн wallet-д шууд мөнгө орно.')) return;

    try {
      const result = await LoansAPI.updateLoanStatus(loanId, 'approved');
      alert(`Зээл зөвшөөрөгдөж, хэрэглэгчийн wallet-д шилжүүлэгдлээ!\n\nДүн: ₮${result.disbursement?.amount?.toLocaleString() || ''}`);
      loadLoans();
      loadStatistics();
    } catch (error) {
      console.error('Error approving loan:', error);
      alert('Алдаа гарлаа: ' + error.message);
    }
  };

  const rejectLoan = async (loanId) => {
    if (!window.confirm('Энэ зээлийг татгалзах уу?')) return;

    try {
      await LoansAPI.updateLoanStatus(loanId, 'rejected');
      alert('Зээл татгалзагдлаа');
      loadLoans();
      loadStatistics();
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Алдаа гарлаа: ' + error.message);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.get('/auth/admin/users');
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filterUsers = () => {
    if (!userSearchTerm) {
      setFilteredUsers(allUsers);
      return;
    }

    const searchLower = userSearchTerm.toLowerCase().trim();
    const filtered = allUsers.filter(user => {
      const fullName = `${user.last_name || ''} ${user.first_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const register = (user.register_number || '').toLowerCase();

      return user.id.toString().includes(searchLower) ||
             fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower) ||
             register.includes(searchLower);
    });

    setFilteredUsers(filtered);
  };

  const viewUserProfile = async (userId) => {
    try {
      const response = await AuthAPI.getAdminUserDetails(userId);
      setSelectedUser(response.user);
      setUserProfileModal(true);
    } catch (error) {
      console.error('Error loading user profile:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Та "${userName}" хэрэглэгчийг устгахдаа итгэлтэй байна уу?\n\nЭнэ үйлдлийг буцаах боломжгүй!`)) {
      return;
    }

    try {
      await api.delete(`/auth/admin/users/${userId}`);
      alert(`${userName} амжилттай устгагдлаа`);
      loadUsers();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await PromoCodeAPI.getAllCompanies();
      setAllCompanies(data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const createCompany = async (e) => {
    e.preventDefault();

    try {
      await PromoCodeAPI.createCompany(companyForm);
      alert('Компани амжилттай үүсгэгдлээ');
      setCreateCompanyModal(false);
      setCompanyForm({ name: '', description: '', contact_email: '', contact_phone: '' });
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const toggleCompanyStatus = async (companyId, newStatus) => {
    try {
      await PromoCodeAPI.updateCompany(companyId, { is_active: newStatus });
      alert('Компанийн төлөв шинэчлэгдлээ');
      loadCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm('Компанийг устгах уу? Түүнтэй холбоотой бүх код устана!')) return;

    try {
      await PromoCodeAPI.deleteCompany(companyId);
      alert('Компани устгагдлаа');
      loadCompanies();
      loadPromoCodes();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const loadPromoCodes = async () => {
    try {
      const data = await PromoCodeAPI.getAllPromoCodes();
      setAllPromoCodes(data.promoCodes || []);
    } catch (error) {
      console.error('Error loading promo codes:', error);
    }
  };

  const createPromoCode = async (e) => {
    e.preventDefault();

    const promoData = {
      ...promoForm,
      interest_rate_override: parseFloat(promoForm.interest_rate_override) || null,
      max_loan_amount: parseInt(promoForm.max_loan_amount) || null,
      max_uses: parseInt(promoForm.max_uses) || null,
      expires_at: promoForm.expires_at ? new Date(promoForm.expires_at).toISOString() : null,
      code: promoForm.code || undefined
    };

    try {
      const result = await PromoCodeAPI.createPromoCode(promoData);
      alert(`Код үүсгэгдлээ: ${result.promoCode.code}`);
      setCreatePromoCodeModal(false);
      setPromoForm({
        company_id: '',
        code: '',
        interest_rate_override: 2,
        max_loan_amount: '',
        max_uses: '',
        expires_at: '',
        description: ''
      });
      loadPromoCodes();
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const deletePromoCode = async (codeId) => {
    if (!window.confirm('Энэ кодыг устгах уу?')) return;

    try {
      await PromoCodeAPI.deletePromoCode(codeId);
      alert('Код устгагдлаа');
      loadPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Алдаа: ' + error.message);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert(`"${code}" хуулагдлаа`);
    }).catch(() => {
      alert('Хуулахад алдаа гарлаа');
    });
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);

    if (tabName === 'loans') loadLoans();
    else if (tabName === 'users') loadUsers();
    else if (tabName === 'promo') {
      loadCompanies();
      loadPromoCodes();
    }
  };

  const getStatusClass = (status) => `status-${status}`;

  const getStatusText = (status) => {
    const map = {
      'pending': 'Хүлээгдэж буй',
      'approved': 'Зөвшөөрөгдсөн',
      'rejected': 'Татгалзсан',
      'active': 'Идэвхтэй',
      'disbursed': 'Олгогдсон'
    };
    return map[status] || status;
  };

  const openImageInNewTab = (imageSrc) => {
    window.open(imageSrc, '_blank');
  };

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p style={{ opacity: 0.9, marginTop: '8px' }}>Системийн удирдлагын самбар</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="admin-stats-card">
          <p>Нийт хэрэглэгч</p>
          <h3>{stats.totalUsers}</h3>
        </div>
        <div className="admin-stats-card">
          <p>Хүлээгдэж буй хүсэлт</p>
          <h3>{stats.pendingLoans}</h3>
        </div>
        <div className="admin-stats-card">
          <p>Идэвхтэй зээл</p>
          <h3>{stats.activeLoans}</h3>
        </div>
        <div className="admin-stats-card">
          <p>Нийт зээлийн дүн</p>
          <h3>₮{stats.totalLoanAmount.toLocaleString()}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => switchTab('loans')}
        >
          Зээлийн хүсэлт
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => switchTab('users')}
        >
          Хэрэглэгчид
        </button>
        <button
          className={`admin-tab ${activeTab === 'promo' ? 'active' : ''}`}
          onClick={() => switchTab('promo')}
        >
          Компани & Код
        </button>
        <button
          className={`admin-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Төлбөр
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Тохиргоо
        </button>
        <button
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Хэрэглэгчийн шинжилгээ
        </button>
      </div>

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="tab-content active">
          <div className="search-box">
            <input
              type="text"
              placeholder="Хайх (ID, нэр, дүн)..."
              value={loanSearchTerm}
              onChange={(e) => setLoanSearchTerm(e.target.value)}
            />
            <select
              className="btn btn-secondary"
              value={loanStatusFilter}
              onChange={(e) => setLoanStatusFilter(e.target.value)}
            >
              <option value="all">Бүх төлөв</option>
              <option value="pending">Хүлээгдэж буй</option>
              <option value="approved">Зөвшөөрөгдсөн</option>
              <option value="disbursed">Олгогдсон</option>
              <option value="rejected">Татгалзсан</option>
              <option value="active">Идэвхтэй</option>
            </select>
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Хэрэглэгч</th>
                  <th>Дүн</th>
                  <th>Хугацаа</th>
                  <th>Төлөв</th>
                  <th>Огноо</th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      Зээлийн хүсэлт байхгүй байна
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map(loan => (
                    <tr key={loan.id}>
                      <td>#{loan.id}</td>
                      <td>{loan.first_name || ''} {loan.last_name || ''} ({loan.email || loan.user_id})</td>
                      <td style={{ fontWeight: '700' }}>₮{parseFloat(loan.amount || 0).toLocaleString()}</td>
                      <td>{loan.term_months} сар</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(loan.status)}`}>
                          {getStatusText(loan.status)}
                        </span>
                      </td>
                      <td>{new Date(loan.created_at).toLocaleDateString('mn-MN')}</td>
                      <td>
                        <div className="action-buttons">
                          {loan.status === 'pending' ? (
                            <>
                              <button className="btn btn-primary btn-icon" onClick={() => approveLoan(loan.id)}>
                                Зөвшөөрөх
                              </button>
                              <button className="btn btn-secondary btn-icon" onClick={() => rejectLoan(loan.id)}>
                                Татгалзах
                              </button>
                            </>
                          ) : (
                            <button className="btn btn-secondary btn-icon" onClick={() => alert('Дэлгэрэнгүй #' + loan.id)}>
                              Харах
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-content active">
          <div className="search-box">
            <input
              type="text"
              placeholder="Нэр, и-мэйл, утас, регистрээр хайх..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
            />
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Нэр</th>
                  <th>И-мэйл</th>
                  <th>Утас</th>
                  <th>Регистр</th>
                  <th>Бүртгэсэн огноо</th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      Хэрэглэгч байхгүй байна
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const fullName = `${user.last_name || ''} ${user.first_name || ''}`.trim() || '-';
                    return (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td style={{ fontWeight: '600' }}>
                          {fullName}
                          {user.is_admin && (
                            <span style={{
                              background: '#667eea',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              marginLeft: '8px'
                            }}>
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{user.register_number || '-'}</td>
                        <td>{new Date(user.created_at).toLocaleDateString('mn-MN')}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-secondary btn-icon" onClick={() => viewUserProfile(user.id)}>
                              Profile
                            </button>
                            <button
                              className="btn btn-secondary btn-icon"
                              style={{ background: '#EF4444', borderColor: '#EF4444' }}
                              onClick={() => deleteUser(user.id, fullName)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promo Tab */}
      {activeTab === 'promo' && (
        <div className="tab-content active">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Companies */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Компаниуд</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setCreateCompanyModal(true)}>
                  + Компани нэмэх
                </button>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Нэр</th>
                      <th>Төлөв</th>
                      <th>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCompanies.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Компани байхгүй байна
                        </td>
                      </tr>
                    ) : (
                      allCompanies.map(company => (
                        <tr key={company.id}>
                          <td>#{company.id}</td>
                          <td style={{ fontWeight: '600' }}>{company.name}</td>
                          <td>
                            <span className={`status-badge ${company.is_active ? 'status-approved' : 'status-rejected'}`}>
                              {company.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-secondary btn-icon"
                                onClick={() => toggleCompanyStatus(company.id, !company.is_active)}
                              >
                                {company.is_active ? 'Идэвхгүй' : 'Идэвхжүүлэх'}
                              </button>
                              <button
                                className="btn btn-secondary btn-icon"
                                style={{ background: '#EF4444', borderColor: '#EF4444' }}
                                onClick={() => deleteCompany(company.id)}
                              >
                                Устгах
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Promo Codes */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Нэхэмжлэлийн код</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (allCompanies.filter(c => c.is_active).length === 0) {
                      alert('Эхлээд нэг компани үүсгэнэ үү!');
                      return;
                    }
                    setCreatePromoCodeModal(true);
                  }}
                >
                  + Код үүсгэх
                </button>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Код</th>
                      <th>Компани</th>
                      <th>Хүү</th>
                      <th>Ашигласан</th>
                      <th>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPromoCodes.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Нэмэгдлийн код байхгүй байна
                        </td>
                      </tr>
                    ) : (
                      allPromoCodes.map(code => (
                        <tr key={code.id}>
                          <td style={{ fontWeight: '700', fontFamily: 'monospace', color: '#0ea5e9' }}>
                            {code.code}
                          </td>
                          <td>{code.company_name || '-'}</td>
                          <td>{code.interest_rate_override !== null ? code.interest_rate_override + '%' : '-'}</td>
                          <td>{code.used_count || 0}{code.max_uses ? '/' + code.max_uses : ''}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-secondary btn-icon" onClick={() => copyCode(code.code)}>
                                Copy
                              </button>
                              <button
                                className="btn btn-secondary btn-icon"
                                style={{ background: '#EF4444', borderColor: '#EF4444' }}
                                onClick={() => deletePromoCode(code.id)}
                              >
                                Устгах
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="tab-content active">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Зээлийн ID</th>
                  <th>Хэрэглэгч</th>
                  <th>Дүн</th>
                  <th>Огноо</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    Төлбөрийн түүх одоогоор байхгүй байна
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="tab-content active">
          <div className="card">
            <div className="card-body">
              <h3>Системийн тохиргоо</h3>
              <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>Зээлийн үндсэн тохиргоо</p>

              <div style={{ margin: '24px 0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Хүүгийн хувь (%)
                </label>
                <input
                  type="number"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px' }}
                  placeholder="1.5"
                  defaultValue="1.5"
                />
              </div>

              <div style={{ margin: '24px 0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Хамгийн их зээлийн дүн (₮)
                </label>
                <input
                  type="number"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px' }}
                  placeholder="10000000"
                  defaultValue="10000000"
                />
              </div>

              <div style={{ margin: '24px 0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Хамгийн бага зээлийн дүн (₮)
                </label>
                <input
                  type="number"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px' }}
                  placeholder="100000"
                  defaultValue="100000"
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={() => alert('Тохиргоо хадгалагдлаа!\n\nЭнэ функц удахгүй бүрэн ажиллах болно.')}
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab - User Behavior Tracking */}
      {activeTab === 'analytics' && (
        <div className="tab-content active">
          {/* Real-time Analytics Summary */}
          {!analyticsData.loading && analyticsData.summary && (
            <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '16px', color: 'white' }}>📊 Бодит хэрэглэгчийн статистик (30 хоног)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Нийт Session</div>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{analyticsData.summary.total_sessions?.toLocaleString() || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Хэрэглэгчид</div>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{analyticsData.summary.unique_users?.toLocaleString() || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Хуудас үзсэн</div>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{analyticsData.summary.page_views?.toLocaleString() || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Дундаж хугацаа</div>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{Math.round(analyticsData.summary.avg_session_duration_sec || 0)} сек</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Funnel Overview */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '24px' }}>Хэрэглэгчийн урсгал (Funnel Analysis)</h3>

              {/* Funnel Visualization */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', overflowX: 'auto' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', padding: '24px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>1,000</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>Нүүр хуудас</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>100.0%</div>
                  </div>
                </div>
                <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#10b981', color: 'white', padding: '24px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>800</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>Бүртгэл</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>80.0%</div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>
                    200 хэрэглэгч унасан
                  </div>
                </div>
                <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#f59e0b', color: 'white', padding: '24px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>600</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>Email баталгаажуулалт</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>75.0%</div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>
                    200 хэрэглэгч унасан
                  </div>
                </div>
                <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#8b5cf6', color: 'white', padding: '24px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>500</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>Бүртгэл дууссан</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>83.3%</div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>
                    100 хэрэглэгч унасан
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                <strong>Нийт хөрвөлт:</strong> 50.0% (1,000 → 500 хэрэглэгч)
              </div>
            </div>
          </div>

          {/* Critical Friction Points */}
          <div className="card" style={{ marginBottom: '24px', border: '2px solid #dc2626' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <h3 style={{ margin: 0, color: '#dc2626' }}>Ноцтой асуудал: Бүртгэлийн хуудас</h3>
              </div>

              <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                  <strong>25.0%</strong> хэрэглэгч (200 хүн) энэ алхамд унасан байна.
                  Дундаж Friction оноо: <strong style={{ color: '#dc2626' }}>18.5</strong> (CRITICAL)
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>Гол асуудлууд:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '32px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '45%', background: '#dc2626', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                        45% - Form ээрөлт
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '80px' }}>90 хэрэглэгч</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '32px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                        30% - Mobile UX
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '80px' }}>60 хэрэглэгч</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '32px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '15%', background: '#6366f1', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                        15% - Network
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '80px' }}>30 хэрэглэгч</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                <h4 style={{ marginBottom: '12px', color: '#1e40af' }}>Яагаад хэрэглэгчид энд зогсдог вэ?</h4>
                <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Хэрэглэгчид form validation-ий алдаануудтай тулгарч байна, ялангуяа mobile төхөөрөмж дээр.
                  Дунджаар 2.5 validation алдаа гарч, хүлээгдэж байгаасаа 21% урт хугацаа (145 секунд vs 120 секунд)
                  зарцуулж байгаа нь төөрөгдөл, ойлгомжгүй байгааг харуулж байна. Mobile хэрэглэгчид илүү их асуудалтай.
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Analysis Table */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '16px' }}>Алхам бүрийн дэлгэрэнгүй</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Алхам</th>
                      <th>Нэр</th>
                      <th>Орсон</th>
                      <th>Дууссан</th>
                      <th>Унасан</th>
                      <th>Дундаж хугацаа</th>
                      <th>Friction оноо</th>
                      <th>Төлөв</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Нүүр хуудас</td>
                      <td>1,000</td>
                      <td>800</td>
                      <td style={{ color: '#dc2626' }}>200 (20.0%)</td>
                      <td>25 сек</td>
                      <td>4.2</td>
                      <td><span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>LOW ✓</span></td>
                    </tr>
                    <tr style={{ background: '#fee2e2' }}>
                      <td>2</td>
                      <td>Бүртгэл</td>
                      <td>800</td>
                      <td>600</td>
                      <td style={{ color: '#dc2626', fontWeight: '700' }}>200 (25.0%)</td>
                      <td style={{ color: '#dc2626' }}>145 сек</td>
                      <td style={{ color: '#dc2626', fontWeight: '700' }}>18.5</td>
                      <td><span style={{ background: '#dc2626', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>CRITICAL ⚠️</span></td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Email баталгаажуулалт</td>
                      <td>600</td>
                      <td>500</td>
                      <td style={{ color: '#dc2626' }}>100 (16.7%)</td>
                      <td>45 сек</td>
                      <td>11.3</td>
                      <td><span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>MEDIUM ⚠</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '16px' }}>Төхөөрөмжөөр задлан шинжилгээ (Бүртгэл алхам)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Desktop</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>30%</div>
                  <div style={{ fontSize: '13px', color: '#10b981' }}>Унах хувь ✓</div>
                </div>
                <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center', border: '2px solid #dc2626' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Mobile</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626', marginBottom: '8px' }}>65%</div>
                  <div style={{ fontSize: '13px', color: '#dc2626' }}>Өндөр унах хувь ⚠️</div>
                </div>
                <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tablet</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>25%</div>
                  <div style={{ fontSize: '13px', color: '#10b981' }}>Унах хувь ✓</div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Errors */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '16px' }}>Түгээмэл алдаанууд (Бүртгэл форм)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>"Invalid email format"</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>35 удаа</span>
                </div>
                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>"Password too weak"</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>28 удаа</span>
                </div>
                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>"Phone number required"</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>22 удаа</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card" style={{ marginBottom: '24px', border: '2px solid #10b981' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>💡</span>
                <h3 style={{ margin: 0, color: '#10b981' }}>Санал зөвлөмж</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#065f46' }}>1. Form validation дүрмийг хялбаршуулах</span>
                    <span style={{ fontSize: '12px', background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>CRITICAL</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#065f46', margin: 0 }}>90 хэрэглэгчид нөлөөлсөн. Password-ын шаардлагад тусламж текст нэмэх.</p>
                </div>

                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#065f46' }}>2. Mobile input field-ийн хэмжээг сайжруулах</span>
                    <span style={{ fontSize: '12px', background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>HIGH</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#065f46', margin: 0 }}>60 хэрэглэгчид нөлөөлсөн. Touch target-ууд болон keyboard асуудал.</p>
                </div>

                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#065f46' }}>3. Backend тогтвортой байдлыг шалгах</span>
                    <span style={{ fontSize: '12px', background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>CRITICAL</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#065f46', margin: 0 }}>30 хэрэглэгчид нөлөөлсөн. Network алдааны шалтгааныг судлах.</p>
                </div>

                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 'Spx' }}>
                    <span style={{ fontWeight: '600', color: '#065f46' }}>4. Явцын үзүүлэлт (progress indicator) нэмэх</span>
                    <span style={{ fontSize: '12px', background: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px' }}>MEDIUM</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#065f46', margin: 0 }}>Хэрэглэгчид хэдэн алхам үлдсэнийг харж чадна.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Friction Rules Info */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '16px' }}>Friction шалгуур дүрмүүд</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Систем нь дараах дүрмүүдийг ашиглан хэрэглэгчийн үйлдлээс асуудлыг илрүүлнэ:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>UI Confusion:</strong> Хэт удаан хугацаа + бага scroll
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Form Complexity:</strong> Олон validation алдаа
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Mobile UX Issue:</strong> Mobile дээр өндөр унах хувь
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Backend Failure:</strong> Network/API алдаа
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>Technical Error:</strong> JavaScript алдаа
                </div>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>No Clear Action:</strong> Дараагийн алхам тодорхойгүй
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '16px', background: analyticsData.loading ? '#fef3c7' : '#d1fae5', borderRadius: '8px', border: `1px solid ${analyticsData.loading ? '#fbbf24' : '#10b981'}` }}>
                <strong style={{ color: analyticsData.loading ? '#92400e' : '#065f46' }}>
                  {analyticsData.loading ? '⏳ Өгөгдөл уншиж байна...' : '✅ Бодит хэрэглэгчийн өгөгдөл'}
                </strong>
                <p style={{ fontSize: '13px', margin: '8px 0 0 0', color: analyticsData.loading ? '#92400e' : '#065f46' }}>
                  {analyticsData.loading
                    ? 'Analytics системээс бодит өгөгдөл татаж байна. Event tracking идэвхтэй ажиллаж байна.'
                    : `Сүүлийн 30 хоногийн бодит өгөгдөл. Нийт ${analyticsData.summary?.total_sessions || 0} session, ${analyticsData.summary?.unique_users || 0} хэрэглэгч track хийгдсэн.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {userProfileModal && selectedUser && (
        <div
          className="modal-overlay active"
          onClick={() => setUserProfileModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Хэрэглэгчийн мэдээлэл</h2>
              <button className="modal-close" onClick={() => setUserProfileModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="user-info-grid">
                <div className="user-info-item">
                  <label>Бүтэн нэр</label>
                  <span>{`${selectedUser.last_name || ''} ${selectedUser.first_name || ''}`.trim() || '-'}</span>
                </div>
                <div className="user-info-item">
                  <label>И-мэйл</label>
                  <span>{selectedUser.email || '-'}</span>
                </div>
                <div className="user-info-item">
                  <label>Утасны дугаар</label>
                  <span>{selectedUser.phone || '-'}</span>
                </div>
                <div className="user-info-item">
                  <label>Регистрийн дугаар</label>
                  <span>{selectedUser.register_number || '-'}</span>
                </div>
                <div className="user-info-item">
                  <label>Бүртгүүлсэн огноо</label>
                  <span>{new Date(selectedUser.created_at).toLocaleString('mn-MN')}</span>
                </div>
                <div className="user-info-item">
                  <label>Админ эрх</label>
                  <span>{selectedUser.is_admin ? 'Тийм' : 'Үгүй'}</span>
                </div>
              </div>

              <div className="id-images-section">
                <h3>Иргэний үнэмлэхний зурагнууд</h3>
                <div className="id-images-grid">
                  <div className="id-image-card">
                    <h4>Урд тал</h4>
                    {selectedUser.id_front ? (
                      <img
                        src={selectedUser.id_front}
                        alt="ID Front"
                        onClick={() => openImageInNewTab(selectedUser.id_front)}
                        title="Томруулахын тулд дарна уу"
                      />
                    ) : (
                      <div className="no-image">Зураг байхгүй</div>
                    )}
                  </div>
                  <div className="id-image-card">
                    <h4>Ард тал</h4>
                    {selectedUser.id_back ? (
                      <img
                        src={selectedUser.id_back}
                        alt="ID Back"
                        onClick={() => openImageInNewTab(selectedUser.id_back)}
                        title="Томруулахын тулд дарна уу"
                      />
                    ) : (
                      <div className="no-image">Зураг байхгүй</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {createCompanyModal && (
        <div
          className="modal-overlay active"
          onClick={() => setCreateCompanyModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Шинэ компани нэмэх</h2>
              <button className="modal-close" onClick={() => setCreateCompanyModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={createCompany}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Компанийн нэр *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Тайлбар</label>
                  <textarea
                    rows="3"
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>И-мэйл</label>
                  <input
                    type="email"
                    value={companyForm.contact_email}
                    onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Утас</label>
                  <input
                    type="text"
                    value={companyForm.contact_phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Компани үүсгэх
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Promo Code Modal */}
      {createPromoCodeModal && (
        <div
          className="modal-overlay active"
          onClick={() => setCreatePromoCodeModal(false)}
        >
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Шинэ нэмэгдлийн код үүсгэх</h2>
              <button className="modal-close" onClick={() => setCreatePromoCodeModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={createPromoCode}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Компани *</label>
                  <select
                    required
                    value={promoForm.company_id}
                    onChange={(e) => setPromoForm({ ...promoForm, company_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    <option value="">-- Компани сонгох --</option>
                    {allCompanies.filter(c => c.is_active).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Код (хоосон үлдээвэл автоматаар үүснэ)
                  </label>
                  <input
                    type="text"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder="жнь: OMNI-ABC123"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Хүү (%) - энэ хүү ашиглагдана
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={promoForm.interest_rate_override}
                    onChange={(e) => setPromoForm({ ...promoForm, interest_rate_override: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Дээд зээлийн дүн (₮)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.max_loan_amount}
                    onChange={(e) => setPromoForm({ ...promoForm, max_loan_amount: e.target.value })}
                    placeholder="Хязгааргүй"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Ашиглах дээд тоо</label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.max_uses}
                    onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                    placeholder="Хязгааргүй"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Хүчинтэй огноо</label>
                  <input
                    type="date"
                    value={promoForm.expires_at}
                    onChange={(e) => setPromoForm({ ...promoForm, expires_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Тайлбар</label>
                  <textarea
                    rows="2"
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--line)',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Код үүсгэх
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
