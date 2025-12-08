import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TokenManager, UserManager, LastPageManager, AuthAPI } from '../../services/api';
import { showToast } from '../../services/utils';
import '../../styles/forms.css';
import '../../styles/cards.css';
import '../../styles/auth.css';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    if (TokenManager.isAuthenticated()) {
      // Сүүлд зочилсон хуудас руу шилжих
      const redirectPath = LastPageManager.getRedirectPath();
      navigate(redirectPath);
    }
  }, [navigate]);

  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 8);
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone || phone.length < 8) {
      showToast('Утасны дугаар буруу байна', 'error');
      return;
    }

    if (!password) {
      showToast('Нууц үг оруулна уу', 'error');
      return;
    }

    setIsLoading(true);

    try {
      showToast('Нэвтэрч байна...', 'info');

      await AuthAPI.login({
        phone: phone,
        password: password
      });

      showToast('Амжилттай нэвтэрлээ!', 'success');

      setTimeout(() => {
        // Сүүлд зочилсон хуудас руу шилжих
        const redirectPath = LastPageManager.getRedirectPath();
        navigate(redirectPath);
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Нэвтрэх үед алдаа гарлаа', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="card-body" style={{ padding: '48px 40px' }}>
          <div className="auth-header">
            <h1>Тавтай морил!</h1>
            <p style={{ color: 'var(--text-muted)' }}>Өөрийн дансанд нэвтрэх</p>
          </div>

          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Утасны дугаар</label>
              <input
                type="tel"
                id="loginPhone"
                className="form-control"
                placeholder="99001122"
                required
                maxLength="8"
                value={phone}
                onChange={handlePhoneInput}
              />
              <span className="form-text">8 оронтой дугаар</span>
            </div>

            <div className="form-group">
              <label className="form-label required">Нууц үг</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  id="toggleLoginPassword"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div className="form-check">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Сануул</label>
              </div>
              <a href="#" style={{ fontSize: '14px' }}>Нууц үг мартсан?</a>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
              {isLoading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
            </button>
          </form>

          <div className="auth-footer">
            Данс байхгүй юу? <Link to="/register">Бүртгүүлэх</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
