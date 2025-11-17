
(function() {
  // Check if api.js is loaded
  if (typeof TokenManager === 'undefined') {
    console.error('TokenManager not found. Make sure api.js is loaded before auth-guard.js');
    return;
  }

  // List of public pages that don't require authentication
  const publicPages = [
    'index.html',
    'login.html',
    'register.html',
    'aboutus.html',
    'FAQ.html',
    'zeelhuudas.html',
    'purchase-loan.html'
  ];

  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Check if current page is public
  const isPublicPage = publicPages.some(page => currentPage.includes(page));

  // If not a public page and user is not authenticated, redirect to login
  if (!isPublicPage && !TokenManager.isAuthenticated()) {
    console.log('Authentication required. Redirecting to login...');
    window.location.href = 'login.html';
  }

  // If authenticated, load user data and update UI
  if (TokenManager.isAuthenticated()) {
    const user = UserManager.getUser();

    // Check if admin trying to access regular dashboard
    if (user && user.is_admin && currentPage.includes('dashboard.html')) {
      console.log('Admin user detected. Redirecting to admin dashboard...');
      window.location.href = 'admin.html';
      return;
    }

    // Check if regular user trying to access admin dashboard
    if (user && !user.is_admin && currentPage.includes('admin.html')) {
      console.log('Non-admin user detected. Redirecting to regular dashboard...');
      window.location.href = 'dashboard.html';
      return;
    }

    // Update auth buttons in navigation
    const authButtonsContainer = document.querySelector('.auth-buttons');
    if (authButtonsContainer && user) {
      const firstName = user.first_name || user.firstName || user.email?.split('@')[0] || 'Хэрэглэгч';
      authButtonsContainer.innerHTML = `
        <a href="profile.html" class="btn btn-ghost btn-sm" style="margin-right: 8px;">👤 ${firstName}</a>
        <button class="btn btn-primary btn-sm" onclick="UserManager.logout()">Гарах</button>
      `;
    }
  }

  // Verify token on page load for authenticated pages
  if (!isPublicPage && TokenManager.isAuthenticated()) {
    AuthAPI.verifyToken().then(result => {
      if (!result) {
        console.log('Token invalid. Redirecting to login...');
        window.location.href = 'login.html';
      }
    }).catch(error => {
      console.error('Token verification error:', error);
      UserManager.logout();
    });
  }
})();
