
class Navigation {
  constructor() {
    this.init();
  }

  init() {
    this.updateNavLinks();
    this.setupActiveLinks();
    this.setupStickyNav();
    this.updateAuthButtons();
    this.setupScrollEffect();
    // Mobile menu should be set up LAST after all links are updated
    this.setupMobileMenu();
  }

  // Update navigation links based on login status
  updateNavLinks() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Check if user is authenticated
    const isAuthenticated = typeof TokenManager !== 'undefined' && TokenManager.isAuthenticated();

    // Base navigation links
    const baseLinks = `
      <a href="index.html">Нүүр</a>
      <a href="zeelhuudas.html">Зээлийн тооцоолуур</a>
      <a href="aboutus.html">Бидний тухай</a>
      <a href="FAQ.html">Түгээмэл асуулт</a>
    `;

    if (isAuthenticated) {
      // Add "Миний зээл" for authenticated users
      const user = typeof UserManager !== 'undefined' ? UserManager.getUser() : null;
      navLinks.innerHTML = baseLinks + `
        <a href="my-loans.html">Миний зээл</a>
        <div class="auth-mobile">
          <a href="profile.html" class="btn btn-ghost btn-sm">Профайл</a>
          <a href="dashboard.html" class="btn btn-secondary btn-sm">Dashboard</a>
          <button id="mobileLogoutBtn" class="btn btn-primary btn-sm">Гарах</button>
        </div>
      `;
    } else {
      navLinks.innerHTML = baseLinks + `
        <div class="auth-mobile">
          <a href="login.html" class="btn btn-secondary btn-sm">Нэвтрэх</a>
          <a href="register.html" class="btn btn-primary btn-sm">Бүртгүүлэх</a>
        </div>
      `;
    }
  }

  // Mobile menu toggle
  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const nav = document.querySelector('.nav');

    if (!toggle || !navLinks) {
      console.error('Mobile menu elements not found!');
      return;
    }

    // Toggle button click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Important - prevent document click from immediately closing

      const isActive = navLinks.classList.toggle('active');
      toggle.innerHTML = isActive ? '✕' : '☰';
      toggle.setAttribute('aria-expanded', isActive);

      // Body scroll lock when menu open
      if (isActive) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      console.log('Menu toggled:', isActive); // Debug
    });

    // Close when clicking nav link (use event delegation for dynamically added links)
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
        // Handle mobile logout button
        if (e.target.id === 'mobileLogoutBtn') {
          e.preventDefault();
          if (confirm('Гарахдаа итгэлтэй байна уу?')) {
            if (typeof UserManager !== 'undefined') {
              UserManager.logout();
            } else {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              window.location.href = 'login.html';
            }
          }
          return;
        }

        navLinks.classList.remove('active');
        toggle.innerHTML = '☰';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (nav && !nav.contains(e.target)) {
        navLinks.classList.remove('active');
        toggle.innerHTML = '☰';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Set active link based on current page
  setupActiveLinks() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
      const linkPage = link.getAttribute('href');
      if (linkPage === currentPage || 
          (currentPage === '' && linkPage === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  // Sticky navigation with scroll effect (legacy - kept for compatibility)
  setupStickyNav() {
    // Now handled by setupScrollEffect
  }

  // Scroll effect - add/remove scrolled class
  setupScrollEffect() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };

    // Check initial scroll position
    handleScroll();

    // Listen for scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Update auth buttons based on login status
  updateAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    // Check if user is authenticated
    const isAuthenticated = typeof TokenManager !== 'undefined' && TokenManager.isAuthenticated();

    if (isAuthenticated) {
      // Show profile dropdown for authenticated users
      const user = typeof UserManager !== 'undefined' ? UserManager.getUser() : null;
      const userName = user ? (user.first_name || user.firstName || 'Хэрэглэгч') : 'Хэрэглэгч';
      const userEmail = user ? (user.email || '') : '';
      const initials = userName.charAt(0).toUpperCase();

      authButtons.innerHTML = `
        <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
        <div class="profile-dropdown" id="profileDropdown">
          <button class="profile-trigger" id="profileTrigger">
            <span class="profile-avatar">${initials}</span>
            <span class="profile-name">${userName}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="profile-menu">
            <div class="profile-menu-header">
              <div class="user-name">${userName}</div>
              <div class="user-email">${userEmail}</div>
            </div>
            <div class="profile-menu-items">
              <a href="profile.html" class="profile-menu-item">
                <span class="menu-icon">👤</span>
                <span>Профайл</span>
              </a>
              <a href="profile.html#wallet" class="profile-menu-item">
                <span class="menu-icon">💳</span>
                <span>Wallet</span>
              </a>
              <a href="profile.html#security" class="profile-menu-item">
                <span class="menu-icon">🔒</span>
                <span>Нууцлал</span>
              </a>
              <a href="profile.html#preferences" class="profile-menu-item">
                <span class="menu-icon">⚙️</span>
                <span>Тохиргоо</span>
              </a>
              <div class="profile-menu-divider"></div>
              <button class="profile-menu-item logout" id="logoutBtn">
                <span class="menu-icon">🚪</span>
                <span>Гарах</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Setup profile dropdown toggle
      const profileDropdown = document.getElementById('profileDropdown');
      const profileTrigger = document.getElementById('profileTrigger');

      if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
          }
        });
      }

      // Setup logout handler
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (confirm('Гарахдаа итгэлтэй байна уу?')) {
            if (typeof UserManager !== 'undefined') {
              UserManager.logout();
            } else {
              // Fallback logout
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              window.location.href = 'login.html';
            }
          }
        });
      }
    } else {
      // Show login and register buttons for non-authenticated users
      authButtons.innerHTML = `
        <a href="login.html" class="btn btn-ghost btn-sm">Нэвтрэх</a>
        <a href="register.html" class="btn btn-primary btn-sm">Бүртгүүлэх</a>
      `;
    }
  }

  // Generate navigation HTML
  static render() {
    return `
      <nav class="nav">
        <div class="brand">OmniCredit</div>
        <div class="nav-links">
          <a href="index.html">Нүүр</a>
          <a href="zeelhuudas.html">Зээлийн тооцоолуур</a>
          <a href="aboutus.html">Бидний тухай</a>
          <a href="FAQ.html">Түгээмэл асуулт</a>
          <a href="my-loans.html">Миний зээл</a>
        </div>
        <div class="auth-buttons">
          <a href="login.html" class="btn btn-ghost btn-sm">Нэвтрэх</a>
          <a href="register.html" class="btn btn-primary btn-sm">Бүртгүүлэх</a>
        </div>
        <button class="mobile-menu-toggle" aria-label="Toggle menu">☰</button>
      </nav>
    `;
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Navigation();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}