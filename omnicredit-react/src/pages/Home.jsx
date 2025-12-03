import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TokenManager, UserManager, AuthAPI } from '../services/api';
import '../styles/hero.css';
import '../styles/home-features.css';

const Home = () => {
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [isAdminSectionVisible, setIsAdminSectionVisible] = useState(false);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    const currentUser = UserManager.getUser();
    const token = TokenManager.getToken();

    if (currentUser && token) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user;

          if (user.is_admin) {
            setIsAdminSectionVisible(true);
            loadAllUsers();
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
  };

  const loadAllUsers = async () => {
    const token = TokenManager.getToken();

    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        setAllRegisteredUsers(users);
        setDisplayedUsers(users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const searchUsers = () => {
    const searchTerm = document.getElementById('adminUserSearch')?.value.toLowerCase().trim();

    if (!searchTerm) {
      setDisplayedUsers(allRegisteredUsers);
      return;
    }

    const filtered = allRegisteredUsers.filter(user => {
      const fullName = `${user.last_name || ''} ${user.first_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const register = (user.register_number || '').toLowerCase();

      return fullName.includes(searchTerm) ||
             email.includes(searchTerm) ||
             phone.includes(searchTerm) ||
             register.includes(searchTerm);
    });

    setDisplayedUsers(filtered);
  };

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Бид ногоон ирээдүйг
              <span className="highlight">Санхүүжүүлдэг!</span>
            </h1>
            <p className="hero-description">
              Хялбар, шуурхай, найдвартай. OmniCredit-ээр хүссэн
              зээлээ 5 минутад авах боломжтой. Та зөвхөн өөрийн
              зээлийн нөхцөлийг сонгоод, шууд хүсэлт илгээж болно.
            </p>
            <div className="hero-buttons">
              <Link to="/zeelhuudas" className="btn btn-primary btn-lg">Зээл авах</Link>
              <a href="#why" className="btn btn-secondary btn-lg">Дэлгэрэнгүй</a>
            </div>
          </div>

          <div className="hero-image">
            <img src="/images/hero-illustration.svg" alt="OmniCredit - Ногоон санхүүжилт" />
          </div>
        </div>
      </section>

      <section className="features-hero" id="products">
        <div className="container">
          <div className="features-grid">

            <div className="feature-card">
              <div className="feature-image">
                <img src="/images/consumer-loan.svg" alt="Хэрэглээний зээл" />
                <div className="feature-overlay">
                  <span className="feature-tag">Түгээмэл</span>
                </div>
              </div>
              <div className="feature-content">
                <h3>Хэрэглээний зээл</h3>
                <p>Өдөр тутмын зардал, гэр ахуйн хэрэгцээнд зориулсан хурдан зээл.</p>
                <Link to="/zeelhuudas" className="btn btn-primary">
                  Дэлгэрэнгүй
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>

            <div className="feature-card featured">
              <div className="feature-badge">Хит</div>
              <div className="feature-image">
                <img src="/images/purchase-loan.svg" alt="Худалдан авалтын зээл" />
                <div className="feature-glow"></div>
              </div>
              <div className="feature-content">
                <h3>Худалдан авалтын зээл</h3>
                <p>Бараа авахдаа урьдчилгаа төлөхгүйгээр хэсэгчлэн төлөх боломж.</p>
                <Link to="/purchase-loan" className="btn btn-white">
                  Дэлгэрэнгүй
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="container">

        <section className="why-us" id="why">
          <h2 className="section-title">Та яагаад биднийг сонгох ёстой вэ?</h2>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon"></div>
              <h3>Бүх зүйл ойлгомжтой</h3>
              <p>Та ямар хураамж, хүү төлөхөө урьдчилан мэдэх боломжтой. Ямар ч нууц зардал байхгүй.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"></div>
              <h3>5 минутад шийдэх</h3>
              <p>Хүсэлт илгээснээс хойш 5 минутын дотор танд хариу ирнэ. Хүлээх хэрэггүй.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"></div>
              <h3>Та төлөх хугацаагаа сонгоно</h3>
              <p>2-24 сарын хооронд сонгох боломжтой. Хугацаанаас өмнө төлбөл хөнгөлөлттэй.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"></div>
              <h3>Мэдээлэл нууцлалт</h3>
              <p> Таны нууц мэдээлэл бидэнд чухал.</p>
            </div>
          </div>
        </section>

        {isAdminSectionVisible && (
          <section id="registeredUsersSection" style={{ marginTop: '60px' }}>
            <h2 className="section-title">Бүртгэлтэй хэрэглэгчид</h2>
            <div style={{ background: 'var(--card)', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  id="adminUserSearch"
                  placeholder="Нэр, и-мэйл, утас, регистрээр хайх..."
                  style={{ flex: 1, padding: '12px 16px', border: '2px solid var(--line)', borderRadius: 'var(--radius)', fontSize: '1rem' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchUsers();
                    }
                  }}
                />
                <button className="btn btn-primary" onClick={searchUsers}>Хайх</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700 }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700 }}>Нэр</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700 }}>И-мэйл</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700 }}>Утас</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700 }}>Регистр</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700 }}>Бүртгүүлсэн</th>
                    </tr>
                  </thead>
                  <tbody id="usersListTable">
                    {displayedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Бүртгэлтэй хэрэглэгч олдсонгүй
                        </td>
                      </tr>
                    ) : (
                      displayedUsers.map(user => {
                        const date = new Date(user.created_at).toLocaleDateString('mn-MN');
                        const fullName = `${user.last_name || ''} ${user.first_name || ''}`.trim() || '-';

                        return (
                          <tr key={user.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '12px' }}>#{user.id}</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{fullName}</td>
                            <td style={{ padding: '12px' }}>{user.email || '-'}</td>
                            <td style={{ padding: '12px' }}>{user.phone || '-'}</td>
                            <td style={{ padding: '12px' }}>{user.register_number || '-'}</td>
                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{date}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div id="usersCount" style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Нийт: {displayedUsers.length} хэрэглэгч
              </div>
            </div>
          </section>
        )}

        <section className="partners" id="partners">
          <h2 className="section-title">Бидэнтэй хамтран ажиллах уу?</h2>
          <p style={{ maxWidth: '700px', margin: 'auto', color: 'var(--text-muted)' }}>
            Хэрэв та онлайн дэлгүүр эсвэл бизнес эрхэлж байгаа бол OmniCredit-тэй хамтарч,
            худалдан авагчиддаа хэсэгчлэн төлөх боломж олгоорой. Энэ нь таны борлуулалтыг нэмэгдүүлнэ.
          </p>
          <div className="partner-grid">
            <div className="partner-card">Дэлгүүр 1</div>
            <div className="partner-card">Дэлгүүр 2</div>
            <div className="partner-card">Дэлгүүр 3</div>
            <div className="partner-card">Дэлгүүр 4</div>
          </div>
          <a href="mailto:info@omnicredit.mn" className="cta">Бидэнтэй холбогдох</a>
        </section>
      </div>
    </>
  );
};

export default Home;
