import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TokenManager, UserManager } from '../../services/api';

const Navigation = () => {
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileDropdownActive, setIsProfileDropdownActive] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    const authenticated = TokenManager.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUser(UserManager.getUser());
    }
  }, []);

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when location changes
    setIsMenuActive(false);
    document.body.style.overflow = '';
  }, [location]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (isProfileDropdownActive && !e.target.closest('.profile-dropdown')) {
        setIsProfileDropdownActive(false);
      }
      if (isMenuActive && !e.target.closest('.nav')) {
        setIsMenuActive(false);
        document.body.style.overflow = '';
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileDropdownActive, isMenuActive]);

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    const newState = !isMenuActive;
    setIsMenuActive(newState);
    document.body.style.overflow = newState ? 'hidden' : '';
  };

  const handleLogout = () => {
    if (window.confirm('Гарахдаа итгэлтэй байна уу?')) {
      UserManager.logout();
    }
  };

  const handleMobileLogout = (e) => {
    e.preventDefault();
    handleLogout();
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const userName = user ? (user.first_name || user.firstName || 'Хэрэглэгч') : 'Хэрэглэгч';
  const userEmail = user ? (user.email || '') : '';
  const initials = userName.charAt(0).toUpperCase();

  return (
    <nav className={`nav ${isScrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="brand">OmniCredit</Link>

      <div className={`nav-links ${isMenuActive ? 'active' : ''}`}>
        <Link to="/" className={isActive('/') ? 'active' : ''}>Нүүр</Link>
        <Link to="/zeelhuudas" className={isActive('/zeelhuudas') ? 'active' : ''}>Зээлийн тооцоолуур</Link>
        <Link to="/aboutus" className={isActive('/aboutus') ? 'active' : ''}>Бидний тухай</Link>
        <Link to="/faq" className={isActive('/faq') ? 'active' : ''}>Түгээмэл асуулт</Link>
        {isAuthenticated && (
          <Link to="/my-loans" className={isActive('/my-loans') ? 'active' : ''}>Миний зээл</Link>
        )}

        <div className="auth-mobile">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="btn btn-ghost btn-sm">Профайл</Link>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
              <button id="mobileLogoutBtn" className="btn btn-primary btn-sm" onClick={handleMobileLogout}>
                Гарах
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Нэвтрэх</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Бүртгүүлэх</Link>
            </>
          )}
        </div>
      </div>

      <div className="auth-buttons">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-dashboard">Dashboard</Link>
            <div
              className={`profile-dropdown ${isProfileDropdownActive ? 'active' : ''}`}
              id="profileDropdown"
            >
              <button
                className="profile-trigger"
                id="profileTrigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileDropdownActive(!isProfileDropdownActive);
                }}
              >
                <span className="profile-avatar">{initials}</span>
                <span className="profile-name">{userName}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="user-name">{userName}</div>
                  <div className="user-email">{userEmail}</div>
                </div>
                <div className="profile-menu-items">
                  <Link to="/profile" className="profile-menu-item">Профайл</Link>
                  <Link to="/profile#wallet" className="profile-menu-item">Wallet</Link>
                  <Link to="/profile#security" className="profile-menu-item">Нууцлал</Link>
                  <Link to="/profile#preferences" className="profile-menu-item">Тохиргоо</Link>
                  <div className="profile-menu-divider"></div>
                  <button className="profile-menu-item logout" id="logoutBtn" onClick={handleLogout}>
                    Гарах
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Нэвтрэх</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Бүртгүүлэх</Link>
          </>
        )}
      </div>

      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMenuActive}
      >
        {isMenuActive ? '✕' : '☰'}
      </button>
    </nav>
  );
};

export default Navigation;
