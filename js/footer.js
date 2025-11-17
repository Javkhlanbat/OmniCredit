

class Navigation {
  constructor() {
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupActiveLinks();
    this.setupStickyNav();
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


document.addEventListener('DOMContentLoaded', () => {
  new Navigation();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}