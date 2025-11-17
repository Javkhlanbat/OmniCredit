
const Utils = {
  // Тоог мөнгөн дүн болгон форматлах (жишээ: 1000000 -> ₮1,000,000)
  formatMoney(amount) {
    const formatter = new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount).replace('MNT', '₮');
  },

  // Тоог мянгатын тэмдэглэгээтэй форматлах (жишээ: 1000000 -> 1,000,000)
  formatNumber(num) {
    return new Intl.NumberFormat('mn-MN').format(num);
  },

  // Тоог мин, макс хооронд хязгаарлах
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  // Мөнгөн string-ийг тоо болгон хөрвүүлэх (жишээ: "₮1,000" -> 1000)
  parseMoney(str) {
    return parseFloat(str.replace(/[₮,\s]/g, '')) || 0;
  },

  // Зээлийн сарын төлбөр тооцоолох
  calculateLoanPayment(principal, annualRate, months) {
    // Хүү 0% бол энгийн хуваах
    if (annualRate === 0) {
      return principal / months;
    }
    // Сарын хүү тооцоолох
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  },

  // Зээлийн төлбөрийн хуваарь үүсгэх
  generateLoanSchedule(principal, monthlyRatePercent, months) {
    // Үндсэн дүн хамгийн багадаа 10,000
    principal = Math.max(10000, +principal || 0);
    months = Math.max(1, Math.floor(+months || 0));

    const monthlyRate = (+monthlyRatePercent || 0) / 100;
    let payment, balance = principal;
    const schedule = [];

    // Хүү 0% бол энгийн хуваах
    if (monthlyRate === 0) {
      payment = principal / months;
      for (let i = 1; i <= months; i++) {
        const interest = 0;
        const principalPaid = payment;
        balance = Math.max(0, balance - principalPaid);
        schedule.push({
          month: i,           // Сар
          interest,           // Хүү
          principal: principalPaid,  // Үндсэн төлбөр
          payment,            // Нийт төлбөр
          balance,            // Үлдэгдэл
        });
      }
    } else {
      // Хүүтэй зээлийн тооцоолол
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

    // Нийт хүү ба төлбөр тооцоолох
    const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
    const totalPayment = schedule.reduce((sum, item) => sum + item.payment, 0);

    return {
      payment,          // Сарын төлбөр
      totalInterest,    // Нийт хүү
      totalPayment,     // Нийт төлбөр
      schedule,         // Сар бүрийн хуваарь
    };
  },

  // Огноо форматлах (жишээ: 2025-01-15)
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

  // Debounce функц (хэт олон удаа дуудагдахаас сэргийлэх)
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

  // Toast мэдэгдэл харуулах
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

    // Хугацаа дууссаны дараа арилгах
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // И-мэйл шалгах
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Утасны дугаар шалгах (Монголын формат: 8 орон)
  isValidPhone(phone) {
    const re = /^[0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
  },

  // LocalStorage хадгалах системчилсэн функцууд
  storage: {
    // Утга хадгалах
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Storage error:', e);
        return false;
      }
    },
    // Утга авах
    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Storage error:', e);
        return null;
      }
    },
    // Утга устгах
    remove(key) {
      localStorage.removeItem(key);
    },
    // Бүгдийг цэвэрлэх
    clear() {
      localStorage.clear();
    },
  },

  // Элемент рүү зөөлөн scroll хийх
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

// Экспорт (бусад файлд ашиглах)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
