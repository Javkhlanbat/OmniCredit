# 📊 Analytics System Setup

Хэрэглэгчийн үйлдлийг бодитоор track хийх систем.

## 🎯 Юу track хийгддэг вэ?

### Үндсэн Events
- **Page Views** - Хуудас үзсэн
- **Clicks** - Button, Link дарсан
- **Scroll** - Хэр их scroll хийсэн
- **Form Errors** - Форм дээрх алдаанууд
- **Dwell Time** - Хуудсан дээр зарцуулсан хугацаа
- **Form Submissions** - Форм илгээсэн
- **Navigation** - Хуудас шилжилт

### Зээлийн хүсэлт - Тусгай Tracking
- **loan_application_view** - Зээлийн хүсэлт хуудас үзсэн
- **loan_application_blocked** - Нэвтрээгүй учир хүсэлт үүсгэж чадаагүй
- **loan_application_started** - Хэрэглэгч форм бөглөж эхэлсэн
- **loan_application_submit_attempt** - "Хүсэлт илгээх" товч дарсан
- **loan_application_validation_error** - Форм validation алдаа гарсан
- **loan_application_completed** - Амжилттай илгээгдсэн
- **loan_application_failed** - Backend алдаа буцаасан

### Зээлийн тооцоолуур - Calculator Events
- **calculator_navigate_to_application** - "Хүсэлт илгээх" товч дарсан
- **calculator_apply_clicked** - Тооцоолуураас шууд зээл хүссэн
- **calculator_apply_blocked** - Нэвтрээгүй учир зээл авч чадаагүй
- **calculator_apply_cancelled** - Баталгаажуулалтаас татгалзсан
- **calculator_loan_completed** - Тооцоолуураас амжилттай зээл авсан
- **calculator_loan_failed** - Тооцоолуураас зээл авахад алдаа гарсан

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
- **Funnel analysis** - Зээлийн хүсэлтийн бүх алхам (8 step)
  1. Нүүр хуудас
  2. Бүртгэл хуудас
  3. Бүртгэл дууссан
  4. Зээлийн тооцоолуур
  5. Зээлийн хүсэлт хуудас
  6. Хүсэлт эхэлсэн ⭐
  7. Хүсэлт илгээсэн ⭐
  8. Хүсэлт амжилттай ⭐
- **Device breakdown** - Mobile эсвэл Desktop (Drop-off rate-тай)
- **Common form errors** - Ямар талбар дээр хамгийн их алдаа гарч байна
- **Friction points** - Хаана хэрэглэгчид унаж байна (validation, blocked, failed)
- **Session statistics** - Нийт sessions, unique users, avg dwell time

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
- **Зээлийн хүсэлт бүх алхам дээр дэлгэрэнгүй track хийгдэнэ**
- **Хаана хэрэглэгч унаж байгааг харж болно**

## 🎯 Хамгийн чухал ашиглалт

Зээлийн хүсэлтийн funnel-ийг дэлгэрэнгүй шалгаж, хаана хэрэглэгчид татгалзаж байгааг олох:

1. **Admin dashboard** руу орох
2. **Funnel Analysis** шалгах - Ямар алхам дээр хамгийн их алдагдал байна
3. **Friction Points** үзэх - Яагаад унаж байгааг ойлгох
   - Validation errors → Форм засах
   - Blocked count → Нэвтрэх процесс хялбарчлах
   - Failed count → Backend засах

**Дэлгэрэнгүй заавар:** `LOAN_TRACKING.md` файл уншина уу

## 🔐 Privacy

- IP address хадгалахгүй
- Зөвхөн event type, timestamp, URL хадгална
- User ID нэвтэрсэн тохиолдолд л холбогдоно
- GDPR compliant (хэрэглэгч устгавал event-үүд нь user_id NULL болно)
