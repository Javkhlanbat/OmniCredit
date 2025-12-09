import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { LoansAPI, AuthAPI, PromoCodeAPI, TrackingAPI, api } from '../services/api';
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

  // Real tracking data
  const [realFunnelData, setRealFunnelData] = useState([]);
  const [realBounceData, setRealBounceData] = useState(null);
  const [pageAnalyticsData, setPageAnalyticsData] = useState([]);

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

      // Load real tracking data using TrackingAPI
      const [funnelData, bounceData, summaryData, pageAnalytics] = await Promise.all([
        TrackingAPI.getFunnelData(),
        TrackingAPI.getBounceRate(),
        TrackingAPI.getSummary(),
        TrackingAPI.getPageAnalytics()
      ]);

      setRealFunnelData(funnelData.stages || []);
      setRealBounceData(bounceData);
      setPageAnalyticsData(pageAnalytics.pages || []);

      setAnalyticsData({
        funnel: funnelData.stages || [],
        devices: [],
        errors: [],
        summary: summaryData.summary || null,
        loading: false
      });

      console.log('📊 Real tracking data loaded:', {
        funnel: funnelData.stages,
        bounce: bounceData,
        summary: summaryData.summary,
        pageAnalytics: pageAnalytics.pages
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


          {/* Funnel Overview */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Хэрэглэгчийн урсгал </h3>
              </div>

              {/* Funnel Visualization - REAL DATA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', overflowX: 'auto', opacity: (!analyticsData.loading && analyticsData.summary?.total_sessions === 0) ? 0.5 : 1 }}>
                {realFunnelData.length > 0 ? (
                  realFunnelData.map((stage, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1, textAlign: 'center', minWidth: '150px' }}>
                        <div style={{ background: stage.color || 'var(--primary)', color: 'white', padding: '24px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '32px', fontWeight: '800' }}>{stage.value.toLocaleString()}</div>
                          <div style={{ fontSize: '14px', marginTop: '8px' }}>{stage.name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>
                            {realFunnelData[0]?.value > 0 ? ((stage.value / realFunnelData[0].value) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                        {index > 0 && realFunnelData[index - 1]?.value > stage.value && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>
                            {(realFunnelData[index - 1].value - stage.value).toLocaleString()} унасан
                          </div>
                        )}
                      </div>
                      {index < realFunnelData.length - 1 && (
                        <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ background: 'var(--primary)', color: 'white', padding: '24px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800' }}>0</div>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>Нүүр хуудас</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>-</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ background: '#10b981', color: 'white', padding: '24px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800' }}>0</div>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>Зээлийн хуудас</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>-</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ background: '#f59e0b', color: 'white', padding: '24px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800' }}>0</div>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>Тооцоолуур</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>-</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ background: '#8b5cf6', color: 'white', padding: '24px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800' }}>0</div>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>Зээл авсан</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>-</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                <strong>Нийт хөрвөлт:</strong> {realFunnelData.length > 0 && realFunnelData[0]?.value > 0
                  ? `${((realFunnelData[realFunnelData.length - 1]?.value / realFunnelData[0].value) * 100).toFixed(1)}% (${realFunnelData[0].value.toLocaleString()} → ${realFunnelData[realFunnelData.length - 1]?.value.toLocaleString()} хэрэглэгч)`
                  : 'Өгөгдөл байхгүй'}
              </div>
            </div>
          </div>

          {/* Critical Friction Points - REAL DATA */}
          <div className="card" style={{ marginBottom: '24px', border: realBounceData?.bounceRate > 20 ? '2px solid #dc2626' : '2px solid #10b981' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>{realBounceData?.bounceRate > 20 ? 'BAD' : 'GOOD'}</span>
                <h3 style={{ margin: 0, color: realBounceData?.bounceRate > 20 ? '#dc2626' : '#10b981' }}>
                  {realBounceData?.bounceRate > 20 ? 'Анхааруулга: Bounce Rate' : 'Сайн байна: Bounce Rate'}
                </h3>
              </div>

              <div style={{ background: realBounceData?.bounceRate > 20 ? '#fee2e2' : '#d1fae5', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                  <strong>{realBounceData?.bounceRate?.toFixed(1) || 0}%</strong> bounce rate
                  ({realBounceData?.bouncedSessions || 0} sessions / {realBounceData?.totalSessions || 0} нийт)
                  {realBounceData?.bounceRate > 20 && (
                    <div style={{ marginTop: '8px', color: '#dc2626' }}>
                      Энэ нь хэт өндөр дүн. Хэрэглэгчид сайтад удаан үлдэхгүй байна.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>Төхөөрөмжөөр bounce rate:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {realBounceData?.chromeBouncePercent > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '32px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${realBounceData.chromeBouncePercent}%`, background: '#dc2626', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                          {realBounceData.chromeBouncePercent}% - Chrome
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '80px' }}>хэрэглэгч</span>
                    </div>
                  )}
                  {realBounceData?.mobileBouncePercent > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '32px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${realBounceData.mobileBouncePercent}%`, background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'white', fontSize: '13px', fontWeight: '600' }}>
                          {realBounceData.mobileBouncePercent}% - Mobile
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '80px' }}>хэрэглэгч</span>
                    </div>
                  )}
                  {(!realBounceData || (realBounceData.chromeBouncePercent === 0 && realBounceData.mobileBouncePercent === 0)) && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Одоогоор өгөгдөл байхгүй байна
                    </div>
                  )}
                </div>
              </div>

              {realBounceData && realBounceData.totalSessions > 0 && (
                <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                  <h4 style={{ marginBottom: '12px', color: '#1e40af' }}>Дэлгэрэнгүй шинжилгээ</h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    Bounce rate: {realBounceData.bounceRate.toFixed(1)}% ({realBounceData.bouncedSessions} / {realBounceData.totalSessions} sessions)
                  </p>
                </div>
              )}
            </div>
          </div>


          {/* Tracking Status */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '16px' }}>Tracking системийн статус</h3>
              <div style={{ padding: '16px', background: analyticsData.loading ? '#fef3c7' : '#d1fae5', borderRadius: '8px', border: `1px solid ${analyticsData.loading ? '#fbbf24' : '#10b981'}` }}>
                <strong style={{ color: analyticsData.loading ? '#92400e' : '#065f46' }}>
                  {analyticsData.loading ? 'Өгөгдөл уншиж байна...' : ' хэрэглэгчийн өгөгдөл'}
                </strong>
                <p style={{ fontSize: '13px', margin: '8px 0 0 0', color: analyticsData.loading ? '#92400e' : '#065f46' }}>
                  {analyticsData.loading
                    ? 'системээс  өгөгдөл татаж байна. Event tracking идэвхтэй ажиллаж байна.'
                    : `Сүүлийн 30 хоногийн өгөгдөл. Нийт ${analyticsData.summary?.total_sessions || 0} session, ${analyticsData.summary?.unique_users || 0} хэрэглэгч track хийгдсэн.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Page Analytics - Time spent per page */}
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '16px' }}>Хуудас шинжилгээ - Хэрэглэгчид хаана их цаг зарцуулж байна</h3>
              {pageAnalyticsData.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
                  <p>Одоогоор хуудас шинжилгээний өгөгдөл байхгүй байна.</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Хэрэглэгчид сайт ашиглаж эхлэхэд өгөгдөл цуглуулна.</p>
                </div>
              ) : (
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Хуудас</th>
                        <th>Үзсэн тоо</th>
                        <th>Хэрэглэгч</th>
                        <th>Дундаж хугацаа</th>
                        <th>Нийт хугацаа</th>
                        <th>Дарсан тоо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageAnalyticsData.map((page, index) => (
                        <tr key={index}>
                          <td>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{page.title || page.url}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{page.url}</div>
                          </td>
                          <td style={{ fontWeight: '700' }}>{page.visits.toLocaleString()}</td>
                          <td>{page.uniqueUsers.toLocaleString()}</td>
                          <td>
                            <span style={{
                              background: page.avgTimeMinutes > 2 ? '#d1fae5' : page.avgTimeMinutes > 1 ? '#fef3c7' : '#fee2e2',
                              color: page.avgTimeMinutes > 2 ? '#065f46' : page.avgTimeMinutes > 1 ? '#92400e' : '#991b1b',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                              {page.avgTimeMinutes.toFixed(1)} мин
                            </span>
                          </td>
                          <td>{Math.round(page.totalTimeSeconds / 60).toLocaleString()} мин</td>
                          <td>{page.totalClicks.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          
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
