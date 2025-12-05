class TrackingService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.pageStartTime = Date.now();
    this.currentPage = window.location.pathname;
    this.setupEventListeners();
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
      sessionStorage.setItem('session_start', Date.now().toString());
      this.startSession();
    }
    return sessionId;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: this.getBrowserName(),
      language: navigator.language,
      platform: navigator.platform
    };
  }

  getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  async startSession() {
    try {
      await fetch('http://localhost:5000/api/tracking/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          deviceInfo: this.getDeviceInfo(),
          referrer: document.referrer
        })
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  async trackPageView(pagePath, pageTitle) {
    const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);

    if (this.currentPage && timeSpent > 0) {
      await this.trackActivity('page_view', {
        page_url: this.currentPage,
        time_spent: timeSpent
      });
    }

    this.currentPage = pagePath;
    this.pageStartTime = Date.now();

    await this.trackActivity('page_view', {
      page_url: pagePath,
      page_title: pageTitle,
      time_spent: 0
    });
  }

  async trackActivity(actionType, additionalData = {}) {
    const token = localStorage.getItem('token');

    try {
      await fetch('http://localhost:5000/api/tracking/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          actionType,
          deviceInfo: this.getDeviceInfo(),
          referrer: document.referrer,
          ...additionalData
        })
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  async trackLoanApplication(loanData) {
    await this.trackActivity('loan_application', {
      page_url: window.location.pathname,
      loan_type: loanData.loan_type,
      amount: loanData.amount
    });
  }

  setupEventListeners() {
    // Track page unload
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
      if (timeSpent > 0) {
        navigator.sendBeacon(
          'http://localhost:5000/api/tracking/activity',
          JSON.stringify({
            sessionId: this.sessionId,
            actionType: 'page_view',
            page_url: this.currentPage,
            time_spent: timeSpent,
            deviceInfo: this.getDeviceInfo()
          })
        );
      }
    });

    // Track clicks on important elements
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (target.matches('button, a, .card')) {
        this.trackActivity('click', {
          page_url: window.location.pathname,
          element_type: target.tagName,
          element_class: target.className,
          element_text: target.innerText?.substring(0, 100)
        });
      }
    });
  }
}

// Create singleton instance
const trackingService = new TrackingService();
export default trackingService;
