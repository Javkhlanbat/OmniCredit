// =============================================
// Utility Functions
// =============================================

const Utils = {
  // Format number as currency
  formatMoney(amount) {
    const formatter = new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount).replace('MNT', '₮');
  },

  // Format number with thousand separators
  formatNumber(num) {
    return new Intl.NumberFormat('mn-MN').format(num);
  },

  // Clamp number between min and max
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  // Parse money string to number
  parseMoney(str) {
    return parseFloat(str.replace(/[₮,\s]/g, '')) || 0;
  },

  // Calculate loan payment
  calculateLoanPayment(principal, annualRate, months) {
    if (annualRate === 0) {
      return principal / months;
    }
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  },

  // Generate loan schedule
  generateLoanSchedule(principal, monthlyRatePercent, months) {
    principal = Math.max(10000, +principal || 0);
    months = Math.max(1, Math.floor(+months || 0));
    
    const monthlyRate = (+monthlyRatePercent || 0) / 100;
    let payment, balance = principal;
    const schedule = [];

    if (monthlyRate === 0) {
      payment = principal / months;
      for (let i = 1; i <= months; i++) {
        const interest = 0;
        const principalPaid = payment;
        balance = Math.max(0, balance - principalPaid);
        schedule.push({
          month: i,
          interest,
          principal: principalPaid,
          payment,
          balance,
        });
      }
    } else {
      payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
      
      for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const principalPaid = Math.min(payment - interest, balance);
        balance = Math.max(0, balance - principalPaid);
        schedule.push({
          month: i,
          interest,
          principal: principalPaid,
          payment,
          balance,
        });
      }
    }

    const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
    const totalPayment = schedule.reduce((sum, item) => sum + item.payment, 0);

    return {
      payment,
      totalInterest,
      totalPayment,
      schedule,
    };
  },

  // Format date
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show toast notification
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      background: var(--gradient-peachy);
      color: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      max-width: 400px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Validate email
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate phone (Mongolian format)
  isValidPhone(phone) {
    const re = /^[0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
  },

  // Store in localStorage
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Storage error:', e);
        return false;
      }
    },
    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Storage error:', e);
        return null;
      }
    },
    remove(key) {
      localStorage.removeItem(key);
    },
    clear() {
      localStorage.clear();
    },
  },

  // Smooth scroll to element
  scrollTo(element, offset = 0) {
    const el = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  },
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}