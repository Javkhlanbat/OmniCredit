
class Navigation {
  constructor() {
    this.init();
  }

  init() {
    this.updateNavLinks();
    this.setupMobileMenu();
    this.setupActiveLinks();
    this.setupStickyNav();
    this.updateAuthButtons();
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
      navLinks.innerHTML = baseLinks + `<a href="my-loans.html">Миний зээл</a>`;
    } else {
      navLinks.innerHTML = baseLinks;
    }
  }

  // Mobile menu toggle
  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        toggle.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
      });

      // Close menu when clicking a link
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
          toggle.innerHTML = '☰';
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav')) {
          navLinks.classList.remove('active');
          toggle.innerHTML = '☰';
        }
      });
    }
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

  // Sticky navigation with scroll effect
  setupStickyNav() {
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        nav.style.boxShadow = 'var(--shadow)';
      } else {
        nav.style.boxShadow = 'none';
      }

      lastScroll = currentScroll;
    });
  }

  // Update auth buttons based on login status
  updateAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    // Check if user is authenticated
    const isAuthenticated = typeof TokenManager !== 'undefined' && TokenManager.isAuthenticated();

    if (isAuthenticated) {
      // Show dashboard link and logout button for authenticated users
      const user = typeof UserManager !== 'undefined' ? UserManager.getUser() : null;
      const userName = user ? (user.first_name || user.firstName || 'Хэрэглэгч') : 'Хэрэглэгч';

      authButtons.innerHTML = `
        <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
        <button id="logoutBtn" class="btn btn-primary btn-sm">Гарах</button>
      `;

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