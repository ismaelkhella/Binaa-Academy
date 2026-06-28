# أكاديمية بناء — Bina Academy

منصة تعليمية رقمية لطلاب الصف الحادي عشر والثاني عشر في فلسطين.

هذا المشروع يحتوي على:
- **API** — خادم NestJS للتطبيق (موبايل/ويب)
- **Admin** — لوحة تحكم RTL بالعربية للمدير

## المتطلبات

- Node.js 20+
- Docker (PostgreSQL + Redis)
- npm

## البدء السريع

### 1. تشغيل قاعدة البيانات

```bash
docker compose up -d
```

### 2. إعداد وتشغيل API

```bash
cd api
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run start:dev
```

الـ API يعمل على: `http://localhost:3000/api`

### 3. تشغيل لوحة التحكم

```bash
cd admin
npm install
npm run dev
```

لوحة التحكم: `http://localhost:5173`

**بيانات الدخول الافتراضية:**
- البريد: `admin@bina.ps`
- كلمة المرور: `admin123`

## هيكل المشروع

```
bina-academy/
├── api/          # NestJS + Prisma + PostgreSQL
├── admin/        # React + Vite (RTL Arabic)
└── docker-compose.yml
```

## API Endpoints (Phase 1)

### مصادقة الطالب (للتطبيق)
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/auth/request-otp` | طلب OTP |
| POST | `/api/auth/verify-otp` | التحقق والحصول على Token |
| POST | `/api/auth/setup-profile` | اختيار الصف والفرع |
| GET | `/api/me` | بيانات الطالب |
| PUT | `/api/me/parent-phone` | تحديث رقم ولي الأمر |

### المحتوى (للتطبيق)
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/subjects` | المواد حسب الصف والفرع |
| GET | `/api/subjects/:id/videos` | فيديوهات المادة |
| GET | `/api/videos/:id/stream` | رابط التشغيل |
| POST | `/api/videos/:id/mark-viewed` | تسجيل مشاهدة |
| GET | `/api/subscriptions/plans` | خطط الاشتراك |

### لوحة التحكم (Admin)
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/auth/admin/login` | دخول المدير |
| GET | `/api/admin/dashboard` | إحصائيات |
| GET | `/api/admin/students` | قائمة الطلاب |
| GET/POST/PUT | `/api/admin/videos` | إدارة الفيديوهات |
| GET/PUT | `/api/admin/plans` | إدارة الخطط |

## اختبار OTP (التطوير)

في وضع التطوير، يُرجَع رمز OTP في الاستجابة:

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"0599111111"}'
```

## المراحل القادمة

- [ ] الأهداف اليومية والتقييمات (Phase 2)
- [ ] الشات مع المعلم + Push notifications (Phase 3)
- [ ] تقارير واتساب الأسبوعية (Phase 4)
- [ ] DRM + علامة مائية (Phase 5)

## المواد الدراسية

**علمي:** عربي، إنجليزي، رياضيات، فيزياء، كيمياء، أحياء، تكنولوجيا  
**أدبي:** عربي، إنجليزي، رياضيات، تاريخ، جغرافيا، قضايا اجتماعية، تكنولوجيا

---

أكاديمية بناء © 2025
# Binaa-Academy
