// Analytics Event Tracking Service

class AnalyticsTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.flushInterval = 5000; // 5 секунд бүр илгээх
    this.maxEvents = 10;

    this.initTracking();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';

    if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
      deviceType = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
    }

    return {
      deviceType,
      userAgent: ua,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  createEvent(eventType, eventData = {}) {
    return {
      eventType,
      sessionId: this.sessionId,
      userId: this.getUserId(),
      timestamp: Date.now(),
      url: window.location.pathname,
      deviceInfo: this.getDeviceInfo(),
      ...eventData
    };
  }

  track(eventType, eventData = {}) {
    const event = this.createEvent(eventType, eventData);
    this.events.push(event);

    console.log('📊 Event tracked:', eventType, eventData);

    // Автоматаар flush хийх
    if (this.events.length >= this.maxEvents) {
      this.flush();
    }
  }

  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: eventsToSend })
      });

      if (!response.ok) {
        console.error('Failed to send analytics events');
      }
    } catch (error) {
      console.error('Error sending analytics:', error);
      // Алдаа гарвал буцааж events-д нэмэх
      this.events = [...eventsToSend, ...this.events];
    }
  }

  initTracking() {
    // Page view tracking
    this.track('page_view', {
      referrer: document.referrer,
      title: document.title
    });

    // Click tracking
    document.addEventListener('click', (e) => {
      const target = e.target;
      const tagName = target.tagName.toLowerCase();

      if (tagName === 'button' || tagName === 'a') {
        this.track('click', {
          element: tagName,
          text: target.textContent.substring(0, 50),
          className: target.className,
          id: target.id
        });
      }
    });

    // Scroll tracking
    let scrollTimeout;
    let maxScroll = 0;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);

      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      maxScroll = Math.max(maxScroll, scrollPercent);

      scrollTimeout = setTimeout(() => {
        this.track('scroll', {
          scrollPercent: Math.round(maxScroll),
          scrollY: window.scrollY
        });
      }, 1000);
    });

    // Form error tracking
    document.addEventListener('invalid', (e) => {
      if (e.target.tagName.toLowerCase() === 'input') {
        this.track('form_error', {
          fieldName: e.target.name || e.target.id,
          fieldType: e.target.type,
          errorMessage: e.target.validationMessage
        });
      }
    }, true);

    // Page exit tracking
    window.addEventListener('beforeunload', () => {
      const dwellTime = Date.now() - this.startTime;
      this.track('page_exit', {
        dwellTime,
        maxScroll
      });
      this.flush();
    });

    // Периодоор flush хийх
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Custom event tracking methods
  trackFormSubmit(formName, success = true, errors = []) {
    this.track('form_submit', {
      formName,
      success,
      errors,
      errorCount: errors.length
    });
  }

  trackButtonClick(buttonName, buttonAction) {
    this.track('button_click', {
      buttonName,
      buttonAction
    });
  }

  trackNavigation(from, to) {
    this.track('navigation', {
      from,
      to
    });
  }

  trackError(errorType, errorMessage, stackTrace = '') {
    this.track('error', {
      errorType,
      errorMessage,
      stackTrace
    });
  }
}

// Singleton instance
const analytics = new AnalyticsTracker();

export default analytics;
