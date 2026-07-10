# Bina Academy API — Apidog Collection Guide

دليل استيراد API collection الخاص بـ Bina Academy إلى **Apidog** لفريق تطوير الموبايل.

API collection import guide for the **Bina Academy** backend, intended for the mobile dev team.

---

## 📦 ما الذي تحصل عليه | What's Included

| الملف / File | الوصف / Description |
|---|---|
| `openapi.json` | OpenAPI 3.0.3 spec — كل الـ 26 endpoints مع request/response schemas وأمثلة |
| `README.md` | هذا الدليل / This guide |

الـ API نفسه يقدّم الـ spec ديناميكياً على `http://localhost:3000/api/openapi.json` (يحتاج OpenapiModule مفعّل).

The running API also serves the spec live at `http://localhost:3000/api/openapi.json` once the OpenapiModule is enabled.

### 🔄 تجديد الـ spec عند تغيّر الـ API | Regenerating the Spec

عند إضافة endpoint جديد أو تعديل DTO، حدّث الملف `api/docs/openapi.json` يدوياً (يفتح في أي محرر JSON). الـ controller يقرأه مرة واحدة عند الإقلاع ويخزّنه مؤقتاً في الذاكرة، فالتعديلات تظهر بعد restart للـ API.

When endpoints or DTOs change, update `api/docs/openapi.json` manually and restart the API. The file is loaded once at module init and cached, so live edits won't reflect until restart.

**خطة مقترحة للأتمتة (مستقبلية)**: سكريبت `npm run docs:build` يولّد الملف تلقائياً من الـ NestJS metadata عبر `@nestjs/swagger` و `@ApiProperty` decorators لكل DTO. هذا يلزم refactoring للـ DTOs.

**Future automation plan**: an `npm run docs:build` script that auto-generates the spec from NestJS metadata via `@nestjs/swagger` and `@ApiProperty` decorators on every DTO. Requires DTO refactoring.

---

## 🚀 طريقة الاستيراد إلى Apidog | Importing into Apidog

### الخيار ١: استيراد URL (الأفضل للبقاء محدّثاً) | Option 1: URL Import (recommended for live sync)

1. شغّل الـ API محلياً:
   ```bash
   cd api
   npm run start:dev
   ```
2. تأكد أن `http://localhost:3000/api/openapi.json` يعطي 200 (يجب أن يكون باقي الـ collection الاختياري).
3. في Apidog، أنشئ مشروع جديد أو افتح مشروعاً موجوداً.
4. **Project Settings → Import Data → URL**.
5. الصق: `http://localhost:3000/api/openapi.json` (أو عنوان الـ production URL).
6. اضبط **Conflict Resolution = Merge** (للحفاظ على التعديلات اليدوية).
7. فعّل **Import Servers as Environments** لإنشاء بيئات Dev/Prod.
8. اضغط Import.

### الخيار ٢: رفع ملف | Option 2: File Import

1. في Apidog: **Project Settings → Import Data → File Upload**.
2. اختر `openapi.json` من هذا المجلد.
3. نفس خيارات الـ Merge والـ Environments أعلاه.

---

## 🔐 إعداد المصادقة | Authentication Setup

بعد الاستيراد:

1. **Auth folder**: كل endpoints الـ Admin موجودة تحت folder `Admin`. اضبط الـ Auth على Folder level:
   - Type: **Bearer Token**
   - Variable: `{{admin_token}}`
2. بنفس الطريقة، اضبط Auth على folder `Auth`/remaining endpoints → variable `{{student_token}}`.
3. أنشئ **Environment** (مثلاً `Dev` و `Prod`) فيه المتغيرات:
   - `student_token` — اتركه فارغاً، يُملأ بعد login
   - `admin_token` — اتركه فارغاً، يُملأ بعد login
   - `base_url` — `http://localhost:3000/api` للـ Dev، عنوان production للـ Prod

> **⚠️ تذكير**: توكين STUDENT وتوكين ADMIN **مختلفان**. توكين STUDENT يولَّد عبر `/auth/verify-otp` (30 يوم)، توكين ADMIN عبر `/auth/admin/login` (7 أيام). استخدام توكين خاطئ يعطي 401.

---

## 🧪 تشغيل أول طلب | Running Your First Request

### طالب جديد (E2E flow)

1. **تسجيل طالب جديد:** **`POST /auth/register`** مع `{"phone": "0599222222", "password": "student_password", "name": "باسم سعيد", "grade": "GRADE_11", "branch": "SCIENTIFIC"}`
   - احفظ الـ `token` في environment variable `student_token`
2. **دخول طالب مسجل:** **`POST /auth/login`** مع `{"phone": "0599222222", "password": "student_password"}`
   - احفظ الـ `token` في environment variable `student_token`
3. **`GET /me`** للتحقق من session
6. **`GET /subjects`** لاستعراض المواد

### مشغّل فيديو

1. اختر فيديو من **`GET /subjects/:id/videos`** (تحقق من `locked`)
2. **`GET /videos/:id/stream`** للحصول على `streamUrl` + `watermark`
3. اعرض **`watermark.name`** و **`watermark.phone`** على المشغّل
4. عند اكتمال المشاهدة، **`POST /videos/:id/mark-viewed`**

### مدير

1. **`POST /auth/admin/login`** مع `{"email": "...", "password": "..."}`
2. احفظ الـ `token` في `admin_token`
3. **`GET /admin/dashboard`** للـ KPIs

---

## ⚠️ ملاحظات حرجة للمطوّر الموبايل | Critical Mobile Dev Notes

### Quota / Locking
- `locked = (index >= quota)` — يعتمد على **الترتيب داخل المادة المرتّبة**، وليس على المشاهدات السابقة.
- حتى لو لم تُشاهد أبداً، الفيديوات بعد `videosPerSubject` ستكون `locked: true`.

### Watermark
- كل `/videos/:id/stream` يُرجع `watermark: {name, phone}` — **يجب** عرضهما على المشغّل لمنع إعادة المشاركة.

### maxViews
- حدّ افتراضي 3 مشاهدات لكل فيديو (قابل للضبط في DB).
- حتى لو الـ quota يسمح، ستُمنع من البث بعد بلوغ `maxViews`.

### Download Tokens
- يحفظ في DB لمدة `downloadDays` (افتراضي 7).
- حالياً هو placeholder نصي — تواصل مع backend لإضافة CDN Signed URLs.

### Throttling
- `/auth/request-otp` محدود بـ **5 طلبات/دقيقة**.
- كل الـ endpoints الأخرى محدودة بـ 100 طلب/دقيقة (افتراضي Throttler).

### Localization
- أسماء المواد والرسائل كلها بالعربية.
- أرقام الهواتف بصيغة فلسطينية `^05\d{8}$` فقط (مثال: `0591234567`).
- التواريخ بصيغة ISO 8601.

---

## 📂 البنية في Apidog | Apidog Structure After Import

```
Bina Academy API/
├── Auth/
│   ├── POST   /auth/register         (public)
│   ├── POST   /auth/login            (public)
│   ├── POST   /auth/setup-profile    (bearerAuth)
│   └── POST   /auth/admin/login      (public — admin)
├── Users/
│   ├── GET    /me                    (bearerAuth)
│   └── PUT    /me/parent-phone       (bearerAuth)
├── Subjects/
│   ├── GET    /subjects              (bearerAuth)
│   └── GET    /subjects/{id}/videos  (bearerAuth)
├── Videos/
│   ├── GET    /videos/{id}/stream
│   ├── POST   /videos/{id}/mark-viewed
│   └── GET    /videos/{id}/download-token
├── Subscriptions/
│   ├── GET    /subscriptions/plans   (public)
│   └── GET    /subscriptions/me      (bearerAuth)
└── Admin/  ← يتطلب توكين ADMIN
    ├── GET    /admin/dashboard
    ├── GET    /admin/students
    ├── GET    /admin/students/{id}
    ├── PUT    /admin/students/{id}
    ├── POST   /admin/students/{id}/subscription/freeze
    ├── POST   /admin/students/{id}/subscription/grant
    ├── GET    /admin/videos
    ├── POST   /admin/videos
    ├── PUT    /admin/videos/{id}
    ├── DELETE /admin/videos/{id}
    ├── GET    /admin/subjects
    ├── GET    /admin/plans
    ├── PUT    /admin/plans/{id}
    └── GET    /admin/teachers
```

---

## 🛠 تشغيل الـ API على الأجهزة المختلفة | Testing From Devices

| المنصة | Base URL |
|---|---|
| Local dev (PC) | `http://localhost:3000/api` |
| Android emulator | `http://10.0.2.2:3000/api` (loopback للـ host) |
| جهاز Android/iOS حقيقي | `http://<your-LAN-IP>:3000/api` |
| Production | عنوان HTTPS الذي يُعطيه فريق الباك إند |

تأكد أن CORS_ORIGIN في `.env` لا يحجب الـ header `Authorization`.

---

## 📞 التواصل | Questions?

تواصل مع فريق الباك إند عند:
- Endpoint لا يطابق الـ contract
- كود status غير متوقع
- حاجة لـ pagination (حالياً جميع list endpoints تعيد بدون pagination)
- حاجة لـ signed CDN URLs
