# ✅ Deployment Checklist

Render.com дээр deploy хийхийн өмнө эдгээрийг шалгаарай:

## 🔒 Аюулгүй байдал

- [x] `.gitignore` файл үүсгэсэн
- [x] `.env.example` үүсгэсэн (бодит .env БИШИ!)
- [ ] `.env` файл git-д оруулаагүй эсэхийг шалгах
  ```bash
  git ls-files | grep .env
  # Хоосон байх ёстой!
  ```

## 🗄️ Backend бэлтгэл

- [x] CORS тохиргоо шинэчилсэн
- [ ] DATABASE_URL environment variable-д байгаа
- [ ] JWT_SECRET environment variable-д байгаа
- [ ] `package.json` дээр `start` script байгаа эсэхийг шалгах
  ```json
  "scripts": {
    "start": "node server.js"
  }
  ```

## 🎨 Frontend бэлтгэл

- [x] API_CONFIG дээр production URL зөв байгаа эсэхийг шалгах
  ```javascript
  'https://omnicredit-backend.onrender.com/api'
  ```
- [ ] `package.json` дээр `build` script байгаа эсэхийг шалгах
  ```json
  "scripts": {
    "build": "vite build"
  }
  ```

## 📤 Git Push

- [ ] Бүх өөрчлөлтийг commit хийх
  ```bash
  git add .
  git commit -m "Prepare for deployment"
  git push origin master
  ```

## 🚀 Render.com дээр

### Database
- [ ] PostgreSQL database үүсгэх
- [ ] Internal Database URL хуулах

### Backend
- [ ] Web Service үүсгэх
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Environment variables нэмэх:
  - PORT=5000
  - DATABASE_URL=<database URL>
  - JWT_SECRET=omnicredit_super_secret_key_2024
  - NODE_ENV=production

### Frontend
- [ ] Static Site үүсгэх
- [ ] Root Directory: `omnicredit-react`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`

## ✅ Тест

- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend нээж харах: `https://your-frontend.onrender.com`
- [ ] Login/Register ажиллаж байгаа эсэхийг шалгах
- [ ] Browser Console дээр алдаа байхгүй эсэхийг шалгах (F12)

## 📝 Frontend URL солих

Frontend deploy дууссаны дараа:
- [ ] Backend CORS дээр frontend URL нэмэх (server.js)
- [ ] Git commit хийж push хийх
- [ ] Backend автоматаар redeploy хийгдэнэ

---

**Дэлгэрэнгүй заавар:** `DEPLOY_GUIDE.md` файлыг уншина уу.
