import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TokenManager, UserManager, LastPageManager, AuthAPI } from '../../services/api';
import { showToast, isValidEmail } from '../../services/utils';
import '../../styles/forms.css';
import '../../styles/cards.css';
import '../../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    registerId: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [idFrontFile, setIdFrontFile] = useState(null);
  const [idBackFile, setIdBackFile] = useState(null);
  const [idFrontName, setIdFrontName] = useState('Файл сонгох');
  const [idBackName, setIdBackName] = useState('Файл сонгох');
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

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 8);
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, password: val }));

    // Calculate password strength
    let strength = 0;
    if (val.length >= 8) strength++;
    if (val.match(/[a-z]/) && val.match(/[A-Z]/)) strength++;
    if (val.match(/[0-9]/)) strength++;
    if (val.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthClass = () => {
    if (passwordStrength <= 1) return 'weak';
    if (passwordStrength <= 3) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Сул нууц үг';
    if (passwordStrength <= 3) return 'Дунд зэргийн нууц үг';
    return 'Хүчтэй нууц үг';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#ff6b6b';
    if (passwordStrength <= 3) return '#ffa500';
    return '#10b981';
  };

  const handleIdFrontChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setIdFrontFile(file);
      setIdFrontName(file.name);
    }
  };

  const handleIdBackChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setIdBackFile(file);
      setIdBackName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      showToast('Нууц үг таарахгүй байна', 'error');
      return;
    }

    if (!formData.terms) {
      showToast('Үйлчилгээний нөхцөлийг зөвшөөрнө үү', 'error');
      return;
    }

    if (formData.password.length < 8) {
      showToast('Нууц үг доод тал нь 8 тэмдэгт байх ёстой', 'error');
      return;
    }

    if (!idFrontFile || !idBackFile) {
      showToast('Иргэний үнэмлэхний зургийг оруулна уу', 'error');
      return;
    }

    if (formData.phone.length !== 8 || !/^[0-9]{8}$/.test(formData.phone)) {
      showToast('Утасны дугаар 8 оронтой байх ёстой', 'error');
      return;
    }

    const registerIdPattern = /^[А-Яа-яӨҮөүA-Za-z]{2}[0-9]{8}$/;
    if (!registerIdPattern.test(formData.registerId)) {
      showToast('Регистрийн дугаарын формат буруу байна', 'error');
      return;
    }

    if (!isValidEmail(formData.email)) {
      showToast('Зөв имэйл хаяг оруулна уу', 'error');
      return;
    }

    setIsLoading(true);

    try {
      showToast('Бүртгэл үүсгэж байна...', 'info');

      const idFrontBase64 = await fileToBase64(idFrontFile);
      const idBackBase64 = await fileToBase64(idBackFile);

      await AuthAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        registerId: formData.registerId,
        password: formData.password,
        idFront: idFrontBase64,
        idBack: idBackBase64
      });

      showToast('Амжилттай бүртгэгдлээ!', 'success');

      setTimeout(() => {
        // Сүүлд зочилсон хуудас руу шилжих (шинээр бүртгүүлсэн бол dashboard)
        const redirectPath = LastPageManager.getRedirectPath();
        navigate(redirectPath);
      }, 1000);

    } catch (error) {
      console.error('Registration error:', error);
      showToast(error.message || 'Бүртгэл үүсгэхэд алдаа гарлаа', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="card-body" style={{ padding: '48px 40px' }}>
          <div className="auth-header">
            <h1>Бүртгүүлэх</h1>
            <p style={{ color: 'var(--text-muted)' }}>Шинэ данс үүсгэх</p>
          </div>

          <form id="registerForm" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Овог</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  placeholder="Овог"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Нэр</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  placeholder="Нэр"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Имэйл хаяг</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Утасны дугаар</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="99119911"
                required
                maxLength="8"
                pattern="[0-9]{8}"
                value={formData.phone}
                onChange={handlePhoneInput}
              />
              <span className="form-text">8 оронтой дугаар оруулна уу</span>
            </div>

            <div className="form-group">
              <label className="form-label required">Регистрийн дугаар</label>
              <input
                type="text"
                name="registerId"
                className="form-control"
                placeholder="АА12345678"
                required
                pattern="[А-Яа-яӨҮөүA-Za-z]{2}[0-9]{8}"
                value={formData.registerId}
                onChange={handleInputChange}
              />
              <span className="form-text">2 үсэг + 8 тоо (жишээ: АА12345678)</span>
            </div>

            <div className="form-group">
              <label className="form-label required">Иргэний үнэмлэх (Урд тал)</label>
              <div
                style={{
                  border: '2px dashed var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onClick={() => document.getElementById('idFront').click()}
              >
                <input
                  type="file"
                  id="idFront"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  required
                  onChange={handleIdFrontChange}
                />
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: idFrontFile ? 'var(--primary)' : 'inherit' }}>
                  {idFrontName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>PNG, JPG эсвэл PDF</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Иргэний үнэмлэх (Ард тал)</label>
              <div
                style={{
                  border: '2px dashed var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onClick={() => document.getElementById('idBack').click()}
              >
                <input
                  type="file"
                  id="idBack"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  required
                  onChange={handleIdBackChange}
                />
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: idBackFile ? 'var(--primary)' : 'inherit' }}>
                  {idBackName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>PNG, JPG эсвэл PDF</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Нууц үг</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '40px' }}
                  value={formData.password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
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
              <div className="password-strength">
                <div className={`password-strength-bar ${getPasswordStrengthClass()}`}></div>
              </div>
              <span className="form-text" style={{ color: getPasswordStrengthColor() }}>
                {formData.password ? getPasswordStrengthText() : 'Доод тал нь 8 тэмдэгт'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label required">Нууц үг давтах</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '40px' }}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-check" style={{ marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                checked={formData.terms}
                onChange={handleInputChange}
              />
              <label htmlFor="terms">
                <a href="#" style={{ textDecoration: 'underline' }}>Үйлчилгээний нөхцөл</a> болон
                <a href="#" style={{ textDecoration: 'underline' }}>Нууцлалын бодлого</a>-той танилцаж зөвшөөрч байна
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
              {isLoading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
            </button>
          </form>

          <div className="auth-footer">
            Аль хэдийн бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
