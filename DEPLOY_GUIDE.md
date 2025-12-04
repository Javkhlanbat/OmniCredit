# 🚀 Render.com Deploy заавар

## 📋 Бэлтгэл ажил

### 1. GitHub-д кодоо оруулах
```bash
git add .
git commit -m "Ready for deployment"
git push origin master
```

---

## 🗄️ BACKEND DEPLOY (PostgreSQL + Node.js)

### Алхам 1: Database үүсгэх

1. Render.com дээр нэвтрэх: https://render.com
2. **Dashboard → New + → PostgreSQL** дарах
3. Мэдээлэл бөглөх:
   - **Name:** `omnicredit-db`
   - **Database:** `omnicredit`
   - **User:** `omnicredit`
   - **Region:** Singapore (эсвэл ойр газар)
   - **Plan:** Free
4. **Create Database** дарах
5. Database үүссэний дараа **Internal Database URL** хуулах (энэ нь таны DATABASE_URL болно)

### Алхам 2: Backend Web Service үүсгэх

1. **Dashboard → New + → Web Service** дарах
2. GitHub repository холбох:
   - **Connect GitHub repository**
   - Repository сонгох: `OmniCredit`
3. Тохиргоо:
   - **Name:** `omnicredit-backend`
   - **Region:** Singapore
   - **Branch:** `master`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Environment Variables** нэмэх (Advanced → Environment):
   ```
   PORT=5000
   DATABASE_URL=<Алхам 1-ээс хуулсан Internal Database URL>
   JWT_SECRET=omnicredit_super_secret_key_2024
   NODE_ENV=production
   ```

5. **Create Web Service** дарах

### Алхам 3: Backend URL авах

Deploy дууссаны дараа URL гарна:
```
https://omnicredit-backend.onrender.com
```
Энэ URL-ийг frontend дээр ашиглана.

---

## 🎨 FRONTEND DEPLOY (React + Vite)

### Алхам 1: Frontend тохиргоо шалгах

Backend URL зөв байгаа эсэхийг шалгах:

📄 **omnicredit-react/src/services/api.js:**
```javascript
const API_CONFIG = {
    BASE_URL: isLocalHost
        ? 'http://localhost:5000/api'
        : 'https://omnicredit-backend.onrender.com/api', // ✅ Энд backend URL байх
    TIMEOUT: 30000
};
```

### Алхам 2: Frontend Static Site үүсгэх

1. **Dashboard → New + → Static Site** дарах
2. GitHub repository холбох
3. Тохиргоо:
   - **Name:** `omnicredit-frontend`
   - **Branch:** `master`
   - **Root Directory:** `omnicredit-react`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Create Static Site** дарах

### Алхам 3: Frontend URL

Deploy дууссаны дараа URL гарна:
```
https://omnicredit-frontend.onrender.com
```

---

## 🔧 CORS тохиргоо (Backend дээр)

Backend дээр frontend domain зөвшөөрөх:

📄 **backend/server.js** дээр CORS-ийг шинэчлэх:
```javascript
const cors = require('cors');

app.use(cors({
    origin: [
        'http://localhost:5173',                        // Local dev
        'https://omnicredit-frontend.onrender.com'      // Production
    ],
    credentials: true
}));
```

---

## ✅ ШАЛГАХ

### Backend шалгах:
```
https://omnicredit-backend.onrender.com/health
```
Хариулт:
```json
{
    "status": "OK",
    "timestamp": "..."
}
```

### Frontend шалгах:
```
https://omnicredit-frontend.onrender.com
```
Нүүр хуудас харагдах ёстой

---

## ⚠️ АНХААРАХ ЗҮЙЛС

### 1. Free Plan-ий хязгаарлалт
- Backend: 15 минут идэвхгүй байвал унтарна (cold start = 30-60 секунд)
- Database: 90 хоногийн backup
- Bandwidth: 100GB/сар

### 2. Cold Start шийдэл
Frontend-д timeout-ийг 30 секунд болгосон (✅ аль хэдийн хийсэн):
```javascript
TIMEOUT: 30000 // 30 секунд
```

### 3. Database Migration
Анх удаа deploy хийхэд:
1. Render Dashboard → PostgreSQL → Connect → PSQL Command хуулах
2. Local terminal дээр тэр командыг ажиллуулах
3. Database schema үүсгэх:
```bash
psql <connection_string> < backend/setup-tables.sql
```

---

## 🔄 КОД ШИНЭЧЛЭХ

Код шинэчлэхэд:
```bash
git add .
git commit -m "Update code"
git push origin master
```

Render автоматаар deploy хийнэ (Auto-deploy эсвэл Manual deploy).

---

## 🆘 АЛДАА ГАРВАЛ

### Backend алдаа:
1. Render Dashboard → omnicredit-backend → Logs
2. Console.log харах

### Frontend алдаа:
1. Browser → F12 → Console
2. Network tab шалгах

### Database холболт алдаа:
1. DATABASE_URL зөв эсэхийг шалгах
2. Database Internal URL ашиглаж байгаа эсэхийг шалгах

---

## 📞 ХОЛБОО БАРИХ

Асуудал гарвал:
- Render Support: https://render.com/docs
- GitHub Issues үүсгэх
