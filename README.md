# OmniCredit - Онлайн Зээлийн Платформ

> Modern full-stack зээлийн платформ. React + Node.js + PostgreSQL ашигласан.

## 📋 Агуулга

- [Ерөнхий танилцуулга](#ерөнхий-танилцуулга)
- [Технологийн Stack](#технологийн-stack)
- [Системийн Архитектур](#системийн-архитектур)
- [Database Schema](#database-schema)
- [Backend - Хэрхэн ажилладаг](#backend---хэрхэн-ажилладаг)
- [Frontend - Хэрхэн ажилладаг](#frontend---хэрхэн-ажилладаг)
- [Гол Функцүүд](#гол-функцүүд)
- [Analytics System](#analytics-system)
- [Аюулгүй байдал](#аюулгүй-байдал)
- [Installation](#installation)
- [Demo](#demo)

---

## 🎯 Ерөнхий танилцуулга

**OmniCredit** нь хэрэглэгчид онлайнаар зээл хүсэх, төлбөр хийх, wallet удирдах боломжтой платформ юм. Admin нар зээл зөвшөөрөх, хэрэглэгчийн analytics харах боломжтой.

### Шийдсэн асуудал:
- ❌ Уламжлалт банк: 3-7 хоног хүлээх, олон цаас, хязгаарлагдмал цаг
- ✅ OmniCredit: 24/7 онлайн, автомат тооцоолуур, real-time tracking, digital баримт

---

## 🛠 Технологийн Stack

### Frontend (Client)
- **React.js** - Modern UI library (SPA)
- **React Router** - Client-side navigation
- **CSS3** - Custom styling, responsive design
- **localStorage/sessionStorage** - Client-side data persistence

### Backend (Server)
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework, REST API
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### DevOps
- **Git/GitHub** - Version control
- **Render.com** - Cloud hosting (Production)
- **dotenv** - Environment variables

---

## 🏗 Системийн Архитектур

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │
│  │  React UI  │  │   Router   │  │ LocalStorage │      │
│  └─────┬──────┘  └──────┬─────┘  └──────┬───────┘      │
│        │                │                │              │
└────────┼────────────────┼────────────────┼──────────────┘
         │                │                │
         │  HTTP Requests (JSON + JWT Token)
         │                │                │
┌────────▼────────────────▼────────────────▼──────────────┐
│              Node.js + Express Server                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐               │
│  │  Routes  │→ │Controllers│→ │ Models  │               │
│  └──────────┘  └──────────┘  └────┬────┘               │
│                                    │                     │
└────────────────────────────────────┼─────────────────────┘
                                     │
                                     │ SQL Queries
                                     │
┌────────────────────────────────────▼─────────────────────┐
│                  PostgreSQL Database                     │
│                                                          │
│  [users] [loans] [payments] [wallets] [analytics]       │
└──────────────────────────────────────────────────────────┘
```

### Мэдээллийн урсгал:
1. **Browser** - Хэрэглэгч button дарна
2. **React** - Event handler ажиллаж API request илгээнэ
3. **Express Router** - Request хүлээж авна (`/api/loans/apply`)
4. **Controller** - Business logic ажиллуулна (validation, тооцоолол)
5. **Model** - PostgreSQL-д SQL query илгээнэ
6. **Database** - Өгөгдөл буцаана
7. **Response** - JSON format-аар browser руу буцна
8. **React** - State шинэчлээд UI update хийнэ

---

## 💾 Database Schema

### Үндсэн Tables (13 tables)

#### 1. `users` - Хэрэглэгчид
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,         -- bcrypt hash
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  register_number VARCHAR(20) UNIQUE,     -- Регистрийн дугаар
  id_front TEXT,                          -- Үнэмлэхний урд тал (base64)
  id_back TEXT,                           -- Үнэмлэхний ард тал (base64)
  is_admin BOOLEAN DEFAULT false,
  visit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `loans` - Зээлүүд
```sql
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  loan_type VARCHAR(50) NOT NULL,         -- 'personal', 'business', etc.
  amount DECIMAL(12, 2) NOT NULL,         -- Зээлийн дүн
  interest_rate DECIMAL(5, 2) NOT NULL,   -- Жилийн хүү (%)
  term_months INTEGER NOT NULL,           -- Хугацаа (сар)
  monthly_payment DECIMAL(12, 2),         -- Сарын төлбөр
  total_amount DECIMAL(12, 2),            -- Нийт төлбөр (principal + interest)
  status VARCHAR(50) DEFAULT 'pending',   -- pending/approved/disbursed/rejected
  purpose TEXT,
  promo_code_id INTEGER REFERENCES promo_codes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `payments` - Төлбөрүүд
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER REFERENCES loans(id),
  amount DECIMAL(12, 2) NOT NULL,         -- Төлсөн дүн
  principal_amount DECIMAL(12, 2),        -- Үндсэн төлбөр хэсэг
  interest_amount DECIMAL(12, 2),         -- Хүүгийн төлбөр хэсэг
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `wallets` - Хэрэглэгчийн wallet
```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  balance DECIMAL(12, 2) DEFAULT 0,       -- Үлдэгдэл
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. `user_activities` - Analytics tracking
```sql
CREATE TABLE user_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),
  page_url VARCHAR(500),
  action_type VARCHAR(100),               -- page_view, click, etc.
  time_spent INTEGER DEFAULT 0,           -- Seconds
  device_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Бусад tables:**
- `wallet_transactions` - Wallet гүйлгээний түүх
- `companies` - Компаниуд
- `promo_codes` - Промо кодууд
- `user_sessions` - Session tracking
- `analytics_events` - Event tracking
- `funnel_sessions` - Funnel analysis

---

## 🔧 Backend - Хэрхэн ажилладаг

### Folder Structure
```
backend/
├── server.js                 # Entry point
├── src/
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection pool
│   │   └── init-db.js        # Database tables үүсгэх
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── loanController.js
│   │   ├── paymentController.js
│   │   └── analyticsController.js
│   ├── models/               # Database queries
│   │   ├── userModel.js
│   │   ├── loanModel.js
│   │   └── paymentModel.js
│   ├── routes/               # API endpoints
│   │   ├── authRoutes.js
│   │   ├── loanRoutes.js
│   │   └── tracking.js
│   └── middleware/
│       ├── authMiddleware.js # JWT verification
│       └── adminMiddleware.js
```

### Authentication Flow (JWT)

#### 1. Бүртгэл (`POST /api/auth/register`)
```javascript
// authController.js
const register = async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  // 1. Password hash хийх
  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. Database-д хадгалах
  const user = await userModel.create({
    email,
    password: hashedPassword,
    first_name,
    last_name
  });

  // 3. JWT token үүсгэх
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // 4. Client руу буцаах
  res.json({ token, user });
};
```

**Яагаад JWT?**
- Stateless: Server дээр session хадгалахгүй
- Scalable: Multiple server-тэй ажиллана
- Secure: Secret key-ээр signed, expire date-тай

#### 2. Нэвтрэх (`POST /api/auth/login`)
```javascript
const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Database-с хэрэглэгч хайх
  const user = await userModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'И-мэйл эсвэл нууц үг буруу' });
  }

  // 2. Password шалгах
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'И-мэйл эсвэл нууц үг буруу' });
  }

  // 3. JWT token үүсгэх
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user });
};
```

#### 3. Protected Route (Middleware)
```javascript
// authMiddleware.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
  }

  try {
    // Token verify хийх
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email }
    next(); // Дараагийн middleware руу
  } catch (error) {
    return res.status(403).json({ error: 'Token хүчингүй' });
  }
};
```

**Ашиглалт:**
```javascript
// loanRoutes.js
router.get('/my-loans', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Middleware-с ирсэн
  const loans = await loanModel.getUserLoans(userId);
  res.json({ loans });
});
```

### Зээлийн Тооцоолол

#### Monthly Payment Formula
```javascript
// loanController.js
const calculateMonthlyPayment = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return principal / months;
  }

  // Compound interest formula:
  // M = P × [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(monthlyPayment * 100) / 100;
};
```

**Жишээ:**
```
Principal: 1,000,000₮
Annual Rate: 12% (0.12)
Term: 12 months

Monthly Rate: 0.12 / 12 = 0.01 (1%)
Monthly Payment: 88,849₮
Total Payment: 1,066,188₮
Total Interest: 66,188₮
```

#### Interest Accrual (Сар бүрийн хүү)
```javascript
// paymentModel.js
const getLoanBalance = async (loanId) => {
  // 1. Зээлийн мэдээлэл авах
  const loan = await query('SELECT * FROM loans WHERE id = $1', [loanId]);

  // 2. Төлсөн principal авах
  const paymentsResult = await query(`
    SELECT SUM(principal_amount) as total_principal
    FROM payments
    WHERE loan_id = $1
  `, [loanId]);

  const paidPrincipal = paymentsResult.rows[0].total_principal || 0;
  const remainingPrincipal = loan.amount - paidPrincipal;

  // 3. Хүү тооцоолох (сар бүр нэмэгдэнэ)
  const monthsElapsed = Math.floor(
    (Date.now() - new Date(loan.created_at)) / (30 * 24 * 60 * 60 * 1000)
  );

  const monthlyRate = loan.interest_rate / 100 / 12;
  const accruedInterest = remainingPrincipal * monthlyRate * monthsElapsed;

  return {
    remainingPrincipal,
    accruedInterest,
    totalBalance: remainingPrincipal + accruedInterest
  };
};
```

#### Payment Allocation (Төлбөр хуваарилах)
```javascript
// paymentModel.js
const createPayment = async ({ loan_id, amount, payment_method }) => {
  // 1. Үлдэгдэл авах
  const balance = await getLoanBalance(loan_id);

  // 2. Төлбөрийг хуваах: эхлээд хүү, дараа principal
  let interestPaid = 0;
  let principalPaid = 0;

  if (amount >= balance.accruedInterest) {
    // Хүү бүрэн төлөгдөнө
    interestPaid = balance.accruedInterest;
    principalPaid = amount - interestPaid;
  } else {
    // Зөвхөн хүү төлөгдөнө
    interestPaid = amount;
    principalPaid = 0;
  }

  // 3. Database-д хадгалах
  await query(`
    INSERT INTO payments
    (loan_id, amount, principal_amount, interest_amount, payment_method, status)
    VALUES ($1, $2, $3, $4, $5, 'completed')
  `, [loan_id, amount, principalPaid, interestPaid, payment_method]);

  return { interestPaid, principalPaid };
};
```

---

## ⚛️ Frontend - Хэрхэн ажилладаг

### Folder Structure
```
omnicredit-react/
├── src/
│   ├── pages/                # React components (pages)
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LoanCalculator.jsx
│   │   ├── LoanApplication.jsx
│   │   ├── MyLoans.jsx
│   │   ├── Payment.jsx
│   │   └── Admin.jsx
│   ├── components/
│   │   └── common/
│   │       ├── Navigation.jsx
│   │       └── Footer.jsx
│   ├── services/             # API calls
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── trackingService.js
│   │   └── analytics.js
│   ├── styles/               # CSS files
│   └── App.jsx               # Main component
```

### React Component Example

#### Login.jsx - Нэвтрэх хуудас
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI, TokenManager, LastPageManager } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. API call хийх
      const response = await AuthAPI.login(formData.email, formData.password);

      // 2. Token болон user мэдээллийг хадгалах
      TokenManager.setToken(response.token);
      UserManager.setUser(response.user);

      // 3. Redirect хийх
      const redirectPath = LastPageManager.getRedirectPath();
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Нэвтрэх үед алдаа гарлаа');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="И-мэйл"
          required
        />
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Нууц үг"
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Нэвтрэх</button>
      </form>
    </div>
  );
}
```

### API Service Layer

#### api.js - Centralized API calls
```javascript
// API Configuration
export const API_CONFIG = {
  BASE_URL: isLocalHost
    ? 'http://localhost:5000/api'
    : 'https://omnicredit-backend.onrender.com/api',
  TIMEOUT: 30000
};

// Token Manager
export const TokenManager = {
  setToken(token) {
    localStorage.setItem('authToken', token);
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};

// API Helper
const api = {
  async request(endpoint, options = {}) {
    const token = TokenManager.getToken();

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }
};

// Auth API
export const AuthAPI = {
  async login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  async register(userData) {
    return api.post('/auth/register', userData);
  }
};

// Loans API
export const LoansAPI = {
  async getMyLoans() {
    return api.get('/loans/my-loans');
  },

  async applyForLoan(loanData) {
    return api.post('/loans/apply', loanData);
  }
};
```

### State Management with useState

```javascript
// Dashboard.jsx
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    walletBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []); // Mount хийгдэхэд 1 удаа ажиллана

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Parallel requests
      const [loansData, walletData] = await Promise.all([
        LoansAPI.getMyLoans(),
        WalletAPI.getBalance()
      ]);

      setStats({
        totalLoans: loansData.loans.length,
        activeLoans: loansData.loans.filter(l => l.status === 'active').length,
        walletBalance: walletData.balance
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Нийт зээл</h3>
          <p>{stats.totalLoans}</p>
        </div>
        <div className="stat-card">
          <h3>Идэвхтэй зээл</h3>
          <p>{stats.activeLoans}</p>
        </div>
        <div className="stat-card">
          <h3>Wallet үлдэгдэл</h3>
          <p>₮{stats.walletBalance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Гол Функцүүд

### 1. Зээлийн Тооцоолуур

**Frontend (LoanCalculator.jsx):**
```javascript
const [calculation, setCalculation] = useState({
  amount: 1000000,
  termMonths: 12,
  interestRate: 1.5
});

const calculateLoan = () => {
  const { amount, termMonths, interestRate } = calculation;

  const monthlyRate = interestRate / 100;
  const monthlyPayment = amount *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - amount;

  return { monthlyPayment, totalPayment, totalInterest };
};
```

**Real-time update:**
```javascript
<input
  type="range"
  min="100000"
  max="10000000"
  step="100000"
  value={calculation.amount}
  onChange={(e) => setCalculation({
    ...calculation,
    amount: parseInt(e.target.value)
  })}
/>
<p>Сарын төлбөр: ₮{calculateLoan().monthlyPayment.toLocaleString()}</p>
```

### 2. Зураг Upload (Base64)

```javascript
const handleImageUpload = (e, field) => {
  const file = e.target.files[0];

  if (file.size > 5 * 1024 * 1024) {
    alert('Зураг 5MB-аас бага байх ёстой');
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64String = reader.result; // "data:image/jpeg;base64,..."
    setFormData({ ...formData, [field]: base64String });
  };
  reader.readAsDataURL(file);
};
```

**Backend validation:**
```javascript
const isValidBase64Image = (str) => {
  return str.startsWith('data:image/');
};
```

### 3. Last Visited Page Tracking

```javascript
// App.jsx
import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Page view tracking
    trackingService.trackPageView(location.pathname, document.title);

    // Сүүлд зочилсон хуудсыг хадгалах
    if (TokenManager.isAuthenticated()) {
      LastPageManager.setLastPage(location.pathname);
    }
  }, [location]); // URL өөрчлөгдөх бүрт

  return <Routes>...</Routes>;
}
```

**Redirect logic:**
```javascript
// api.js
export const LastPageManager = {
  setLastPage(path) {
    const excludedPaths = ['/login', '/register', '/'];
    if (!excludedPaths.includes(path)) {
      localStorage.setItem('lastVisitedPage', path);
    }
  },

  getRedirectPath() {
    const lastPage = localStorage.getItem('lastVisitedPage');
    const user = UserManager.getUser();

    if (lastPage) return lastPage;
    if (user?.is_admin) return '/admin';
    return '/dashboard';
  }
};
```

---

## 📊 Analytics System

### Architecture

```
Browser Event → trackingService.js → Backend API → PostgreSQL
                                   ↓
                              user_activities
                              user_sessions
                              analytics_events
```

### Frontend Tracking

```javascript
// trackingService.js
class TrackingService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.setupEventListeners();
  }

  async trackPageView(pagePath, pageTitle) {
    await this.trackActivity('page_view', {
      page_url: pagePath,
      page_title: pageTitle,
      time_spent: Math.floor((Date.now() - this.pageStartTime) / 1000)
    });
  }

  setupEventListeners() {
    // Click tracking
    document.addEventListener('click', (e) => {
      if (e.target.matches('button, a')) {
        this.trackActivity('click', {
          element_type: e.target.tagName,
          element_text: e.target.innerText
        });
      }
    });

    // Page unload tracking
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
      navigator.sendBeacon(
        `${API_URL}/tracking/activity`,
        JSON.stringify({ action_type: 'page_exit', time_spent: timeSpent })
      );
    });
  }
}
```

### Backend Analytics Queries

#### Funnel Analysis
```javascript
// tracking.js
router.get('/funnel', authenticateToken, async (req, res) => {
  const funnelData = await pool.query(`
    WITH funnel_stages AS (
      SELECT
        COUNT(DISTINCT CASE WHEN page_url = '/' THEN session_id END) as homepage,
        COUNT(DISTINCT CASE WHEN page_url LIKE '%/loan%' THEN session_id END) as loan_page,
        COUNT(DISTINCT CASE WHEN page_url LIKE '%/calculator%' THEN session_id END) as calculator,
        COUNT(DISTINCT CASE WHEN action_type = 'loan_application' THEN session_id END) as applied
      FROM user_activities
      WHERE created_at >= NOW() - INTERVAL '30 days'
    )
    SELECT * FROM funnel_stages
  `);

  res.json({ stages: funnelData.rows[0] });
});
```

#### Navigation Flow (Window Function)
```sql
WITH page_sequence AS (
  SELECT
    session_id,
    page_url,
    created_at,
    LEAD(page_url) OVER (
      PARTITION BY session_id
      ORDER BY created_at
    ) as next_page
  FROM user_activities
  WHERE action_type = 'page_view'
)
SELECT
  page_url as from_page,
  next_page as to_page,
  COUNT(*) as transition_count
FROM page_sequence
WHERE next_page IS NOT NULL
GROUP BY page_url, next_page
ORDER BY transition_count DESC
```

**Үр дүн:**
```
from_page        | to_page          | transition_count
-----------------+------------------+-----------------
/                | /zeelhuudas      | 145
/zeelhuudas      | /application     | 87
/application     | /dashboard       | 52
```

---

## 🔒 Аюулгүй байдал

### 1. SQL Injection Prevention
```javascript
// ❌ БУРУУ - SQL injection possible
const email = req.body.email;
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ ЗӨВ - Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

### 2. Password Security
```javascript
// Registration
const password = 'user123';
const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10
// Result: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."

// Login
const isValid = await bcrypt.compare(password, hashedPassword);
// bcrypt автоматаар salt-ыг hash-аас салгаж шалгана
```

### 3. XSS Protection
```javascript
// React автоматаар escape хийдэг
const userInput = '<script>alert("XSS")</script>';
return <div>{userInput}</div>;
// Rendered: &lt;script&gt;alert("XSS")&lt;/script&gt;
```

### 4. CORS Configuration
```javascript
// server.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://omnicredit-frontend.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));
```

---

## 🚀 Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 14+
- Git

### Backend Setup
```bash
cd backend
npm install

# Create .env file
DATABASE_URL=postgresql://user:password@localhost:5432/omnicredit
JWT_SECRET=your-secret-key-here
PORT=5000

# Run database initialization
npm start
# Tables автоматаар үүсгэгдэнэ
```

### Frontend Setup
```bash
cd omnicredit-react
npm install
npm run dev
# Opens http://localhost:5173
```

---

## 🌐 Demo

**Production URLs:**
- Frontend: https://omnicredit-frontend.onrender.com
- Backend API: https://omnicredit-backend.onrender.com

**Test Credentials:**
```
Admin:
  Email: admin@omnicredit.com
  Password: admin123

User:
  Email: user@test.com
  Password: user123
```

---

## 📈 Metrics

- **Database Tables:** 13
- **API Endpoints:** 25+
- **React Components:** 20+
- **Lines of Code:** ~5,000+
- **GitHub Commits:** 15+

---

## 🎓 Суралцсан зүйлс

### Technical Skills
- ✅ React.js component lifecycle
- ✅ React Hooks (useState, useEffect, useLocation)
- ✅ JWT authentication implementation
- ✅ RESTful API design
- ✅ PostgreSQL database design & queries
- ✅ SQL window functions, CTEs
- ✅ bcrypt password hashing
- ✅ Base64 image encoding
- ✅ Cloud deployment (Render.com)
- ✅ Git version control

### Soft Skills
- Problem decomposition
- Code organization (MVC pattern)
- Error handling
- Security best practices
- Documentation

---

## 🔮 Future Improvements

1. **Mobile App** - React Native
2. **AI Credit Scoring** - Machine learning
3. **Payment Gateway** - Qpay, SocialPay integration
4. **SMS Notifications** - Twilio API
5. **E-Signature** - Digital signature integration
6. **Multi-language** - i18n support

---

## 📞 Contact

- GitHub: [@Javkhlanbat](https://github.com/Javkhlanbat/OmniCredit)
- Demo: [omnicredit-frontend.onrender.com](https://omnicredit-frontend.onrender.com)

---

**© 2024-2025 OmniCredit. Бүх эрх хуулиар хамгаалагдсан.**
