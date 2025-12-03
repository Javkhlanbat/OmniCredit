// ============================================
// UTILS.JS - Туслах функцуудын цуглуулга
// ============================================
// Энэ файл нь вэбсайт даяар ашиглагдах ерөнхий туслах
// функцуудыг агуулна. Мөнгөн дүн форматлах, зээлийн
// тооцоолол хийх, огноо форматлах гэх мэт.
// ============================================

const Utils = {
  // --------------------------------------------
  // МӨНГӨН ДҮН ФОРМАТЛАХ
  // --------------------------------------------
  // Тоог мөнгөн дүн болгон форматлах (жишээ: 1000000 -> ₮1,000,000)
  // @param {number} amount - Форматлах дүн
  // @return {string} - ₮ тэмдэгтэй, таслалтай мөнгөн дүн
  formatMoney(amount) {
    const formatter = new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,  // Бутархай оронгүй
      maximumFractionDigits: 0,
    });
    return formatter.format(amount).replace('MNT', '₮');
  },

  // --------------------------------------------
  // ТОО ФОРМАТЛАХ
  // --------------------------------------------
  // Тоог мянгатын тэмдэглэгээтэй форматлах (жишээ: 1000000 -> 1,000,000)
  // @param {number} num - Форматлах тоо
  // @return {string} - Таслалтай тоо
  formatNumber(num) {
    return new Intl.NumberFormat('mn-MN').format(num);
  },

  // --------------------------------------------
  // ТОО ХЯЗГААРЛАХ
  // --------------------------------------------
  // Тоог мин, макс хооронд хязгаарлах
  // @param {number} value - Хязгаарлах утга
  // @param {number} min - Доод хязгаар
  // @param {number} max - Дээд хязгаар
  // @return {number} - Хязгаарласан утга
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  // --------------------------------------------
  // МӨНГӨН ДҮН ХӨРВҮҮЛЭХ
  // --------------------------------------------
  // Мөнгөн string-ийг тоо болгон хөрвүүлэх (жишээ: "₮1,000" -> 1000)
  // @param {string} str - Хөрвүүлэх string
  // @return {number} - Цэвэр тоо
  parseMoney(str) {
    // ₮, таслал, хоосон зайг арилгаж тоо болгоно
    return parseFloat(str.replace(/[₮,\s]/g, '')) || 0;
  },

  // --------------------------------------------
  // ЗЭЭЛИЙН САРЫН ТӨЛБӨР ТООЦООЛОХ
  // --------------------------------------------
  // Зээлийн сарын төлбөр тооцоолох
  // @param {number} principal - Зээлийн үндсэн дүн
  // @param {number} annualRate - Жилийн хүү (%)
  // @param {number} months - Хугацаа (сар)
  // @return {number} - Сарын төлбөр
  calculateLoanPayment(principal, annualRate, months) {
    // Хүү 0% бол энгийн хуваах
    if (annualRate === 0) {
      return principal / months;
    }
    // Сарын хүү тооцоолох
    const monthlyRate = annualRate / 100 / 12;
    // PMT томъёогоор тооцоолох
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  },

  // --------------------------------------------
  // ЗЭЭЛИЙН ТӨЛБӨРИЙН ХУВААРЬ ҮҮСГЭХ
  // --------------------------------------------
  // Зээлийн төлбөрийн хуваарь үүсгэх (амортизацийн хүснэгт)
  // @param {number} principal - Зээлийн үндсэн дүн
  // @param {number} monthlyRatePercent - Сарын хүү (%)
  // @param {number} months - Хугацаа (сар)
  // @return {object} - {payment, totalInterest, totalPayment, schedule[]}
  generateLoanSchedule(principal, monthlyRatePercent, months) {
    // Үндсэн дүн хамгийн багадаа 10,000₮
    principal = Math.max(10000, +principal || 0);
    months = Math.max(1, Math.floor(+months || 0));

    const monthlyRate = (+monthlyRatePercent || 0) / 100;
    let payment, balance = principal;
    const schedule = [];

    // Хүү 0% бол энгийн хуваах
    if (monthlyRate === 0) {
      payment = principal / months;
      for (let i = 1; i <= months; i++) {
        const interest = 0;  // Хүү байхгүй
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
      // Хүүтэй зээлийн тооцоолол (PMT томъёо)
      payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

      for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;  // Тухайн сарын хүү
        const principalPaid = Math.min(payment - interest, balance);  // Үндсэн төлбөр
        balance = Math.max(0, balance - principalPaid);  // Үлдэгдэл
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

  // --------------------------------------------
  // ОГНОО ФОРМАТЛАХ
  // --------------------------------------------
  // Огноо форматлах (жишээ: 2025-01-15)
  // @param {Date|string} date - Форматлах огноо
  // @param {string} format - Формат ('YYYY-MM-DD')
  // @return {string} - Форматлагдсан огноо
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');  // 0-11 тул +1
    const day = String(d.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  // --------------------------------------------
  // DEBOUNCE ФУНКЦ
  // --------------------------------------------
  // Debounce функц (хэт олон удаа дуудагдахаас сэргийлэх)
  // Жишээ: Хайлтын талбарт бичих үед бүр хайхгүй, 500ms хүлээнэ
  // @param {function} func - Дуудах функц
  // @param {number} wait - Хүлээх хугацаа (миллисекунд)
  // @return {function} - Debounce хийсэн функц
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

  // --------------------------------------------
  // TOAST МЭДЭГДЭЛ ХАРУУЛАХ
  // --------------------------------------------
  // Toast мэдэгдэл харуулах (дэлгэцийн баруун доод булангаас гарч ирэх)
  // @param {string} message - Мэдэгдлийн текст
  // @param {string} type - Төрөл ('info', 'success', 'error', 'warning')
  // @param {number} duration - Харагдах хугацаа (миллисекунд)
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

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
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

// Export individual functions for React
export const formatMoney = Utils.formatMoney.bind(Utils);
export const formatNumber = Utils.formatNumber.bind(Utils);
export const clamp = Utils.clamp.bind(Utils);
export const parseMoney = Utils.parseMoney.bind(Utils);
export const calculateLoanPayment = Utils.calculateLoanPayment.bind(Utils);
export const generateLoanSchedule = Utils.generateLoanSchedule.bind(Utils);
export const formatDate = Utils.formatDate.bind(Utils);
export const debounce = Utils.debounce.bind(Utils);
export const showToast = Utils.showToast.bind(Utils);
export const isValidEmail = Utils.isValidEmail.bind(Utils);
export const isValidPhone = Utils.isValidPhone.bind(Utils);
export const storage = Utils.storage;
export const scrollTo = Utils.scrollTo.bind(Utils);

// Default export
export default Utils;
