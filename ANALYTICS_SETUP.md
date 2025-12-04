# 📊 Analytics System Setup

Хэрэглэгчийн үйлдлийг бодитоор track хийх систем.

## 🎯 Юу track хийгддэг вэ?

- **Page Views** - Хуудас үзсэн
- **Clicks** - Button, Link дарсан
- **Scroll** - Хэр их scroll хийсэн
- **Form Errors** - Форм дээрх алдаанууд
- **Dwell Time** - Хуудсан дээр зарцуулсан хугацаа
- **Form Submissions** - Форм илгээсэн
- **Navigation** - Хуудас шилжилт

## 🚀 Setup хийх

### 1️⃣ Database Tables үүсгэх

Backend дээр tables үүсгэх:

```bash
cd backend
node create-analytics-tables.js
```

Энэ нь 2 table үүсгэнэ:
- `analytics_events` - Бүх event-үүд
- `funnel_sessions` - Session-уудын summary

### 2️⃣ Backend server restart хийх

```bash
npm run dev
```

Backend `/api/analytics` route-ууд идэвхжинэ.

### 3️⃣ Frontend автоматаар ажиллана

Frontend дээр `App.jsx` import хийснээр analytics автоматаар эхэлнэ.
Хэрэглэгч хуудас нээх бүрд event илгэгдэнэ.

## 📈 Admin Dashboard дээр үзэх

1. Admin эрхтэй нэвтрэх
2. `/admin` хуудас руу очих
3. **"Хэрэглэгчийн шинжилгээ"** tab сонгох

Харагдах мэдээлэл:
- Funnel analysis (хэр олон хэрэглэгч хаана унасан)
- Device breakdown (mobile/desktop)
- Common form errors
- Session statistics

## 🔧 API Endpoints

### Event илгээх (Public)
```
POST /api/analytics/events
Body: { events: [...] }
```

### Funnel Analysis (Admin)
```
GET /api/analytics/funnel
```

### Device Breakdown (Admin)
```
GET /api/analytics/devices
```

### Common Errors (Admin)
```
GET /api/analytics/errors
```

### Summary Statistics (Admin)
```
GET /api/analytics/summary
```

## 💻 Custom Tracking ашиглах

Register.jsx эсвэл бусад хуудсан дээр:

```javascript
import analytics from '../services/analytics';

// Form submit tracking
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await registerUser(data);

    // Track successful submission
    analytics.trackFormSubmit('register', true);

  } catch (error) {
    // Track failed submission
    analytics.trackFormSubmit('register', false, [error.message]);
  }
};

// Custom button tracking
const handleButtonClick = () => {
  analytics.trackButtonClick('apply-loan', 'loan-application');
  // ... your code
};
```

## 🎨 Admin Dashboard Шинэчлэх

Admin.jsx дээр "Хэрэглэгчийн шинжилгээ" tab нь одоо mock data харуулж байна.

Бодит data харуулахын тулд:
1. API call хийж бодит өгөгдөл авах
2. Chart-ууд дээр real data харуулах
3. Friction points-ийг өгөгдлөөс тооцоолох

## 📝 Тэмдэглэл

- Event-үүд 5 секунд бүр эсвэл 10 event цуглахад flush хийгдэнэ
- Session ID автоматаар үүсэнэ
- User ID localStorage-с авагдана (нэвтэрсэн бол)
- Device info автоматаар бүртгэгдэнэ

## 🔐 Privacy

- IP address хадгалахгүй
- Зөвхөн event type, timestamp, URL хадгална
- User ID нэвтэрсэн тохиолдолд л холбогдоно
- GDPR compliant (хэрэглэгч устгавал event-үүд нь user_id NULL болно)
