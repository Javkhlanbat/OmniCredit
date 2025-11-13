# 🏦 OmniCredit - Цэцэг сан

Энэ нь Express.js + PostgreSQL ашиглаж баримтаа бүрдүүлэх **эргэлт цэцэг сан** системийн төслийн дээд хэвлэл юм.

## 📁 Төслийн Бүтэц

```
OmniCredit/
├── backend/              # Node.js + Express API
│   ├── server.js        # Үндсэн сервер
│   ├── package.json
│   ├── .env             # Орчин хувьсагч
│   ├── vercel.json      # Vercel тохиргоо
│   └── src/
│       ├── routes/      # API routes
│       ├── controllers/ # Бизнес логик
│       ├── models/      # Өрөмбийн загвар
│       ├── middleware/  # Auth, validation
│       └── config/      # Database, init
├── pages/               # Frontend HTML
├── css/                 # Стайлын файлууд
├── js/                  # JavaScript логик
└── vercel.json         # Frontend Vercel тохиргоо
```

## 🚀 Орон нутгийн эхлүүлэх

### Шаардлагатай:
- Node.js 16+
- PostgreSQL 12+

### Backend ажиллуулах:

```bash
cd backend
npm install
npm start
```

Сервер нээлэх: `http://localhost:5000`

### Database үүсгэх:

```bash
cd backend
node setup-db.js
```

## 🌐 Vercel дээр байршуулах

### 1. Backend (Express API)

```
Root Directory: backend
Framework: Other
Build Command: npm install
Start Command: npm start
Environment Variables:
  - DATABASE_URL
  - JWT_SECRET
  - NODE_ENV=production
```

### 2. Frontend (Static Site)

```
Root Directory: .
Framework: Other
```

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Бүртгүүлэх
- `POST /api/auth/login` - Нэвтрэх
- `GET /api/auth/profile` - Профайл авах

### 💰 Loans
- `POST /api/loans/apply` - Цэцэг сан авналт
- `GET /api/loans/my` - Миний цэцэг сан
- `POST /api/loans/purchase` - Худалдан авалтын цэцэг сан

### 💳 Payments
- `POST /api/payments` - Төлөлт хийх
- `GET /api/payments/my` - Миний төлөлтүүд
- `GET /api/payments/loan/:loanId` - Цэцэг сан төлөлтүүд

## 🔒 Нууцлалын Тохиргоо

`.env` файл үүсгэнэ:
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/omnicredit
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

## 📦 Dependencies

- **express** - Вэб фреймворк
- **pg** - PostgreSQL драйвер
- **bcrypt** - Нууцлах
- **jsonwebtoken** - JWT аутентификаци
- **cors** - CORS холболт
- **dotenv** - Орчин хувьсагч

## 📝 Лицензи

MIT

## 👨‍💻 Зохиогч

Javkhlanbat
