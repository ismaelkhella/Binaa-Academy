# دليل توصيل تطبيق Flutter ببث المجتمع المباشر

يشرح هذا الدليل كيفية توصيل تطبيق الطلاب بنظام البث المباشر (Socket.IO) الموجود في الـ API، ليستقبل رسائل مجتمع المادة فورياً بدون استطلاع دوري (polling).

---

## 1. إضافة الحزمة

في `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

ثم:

```bash
flutter pub get
```

---

## 2. ملف الخدمة الجاهز

انسخ الملف `community_socket_service.dart` (في نفس مجلد هذا الدليل) إلى مشروع Flutter، مثلاً:

```
lib/services/community_socket_service.dart
```

الملف يحتوي على:
- `CommunitySocketService` — الخدمة الرئيسية
- `CommunityMessage` + `MessageSender` + `MessageAttachment` — نماذج البيانات

---

## 3. بروتوكول الخادم (مرجع)

| الجانب | التفاصيل |
|--------|---------|
| Namespace | `/community` |
| Transport | `websocket` فقط |
| المصادقة | `auth: { token: <access_token> }` في handshake |
| الانضمام | `emit('join', { subjectId })` |
| نجاح الانضمام | `on('joined', { subjectId })` |
| رسالة جديدة | `on('message:new', CommunityMessage)` |
| حذف رسالة | `on('message:deleted', { id, subjectId })` |
| خطأ | `on('error', { message })` |
| المغادرة | `emit('leave', { subjectId })` |

---

## 4. شكل رسالة `message:new`

```json
{
  "id": "uuid",
  "subjectId": "uuid",
  "type": "text | image | voice | file",
  "content": "نص الرسالة أو null",
  "createdAt": "2026-08-09T10:30:00.000Z",
  "sender": {
    "id": "uuid",
    "role": "STUDENT | TEACHER",
    "name": "اسم المرسل",
    "avatarUrl": "https://... أو null"
  },
  "attachment": {
    "id": "uuid",
    "fileName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "url": "/api/community/attachments/uuid"
  }
}
```

`attachment` يكون `null` للرسائل النصية.

رابط المرفق الكامل: `<baseUrl>/api/community/attachments/<id>`  
(يتطلب إرسال `Authorization: Bearer <token>` في الطلب)

---

## 5. الاستخدام في الـ Widget

```dart
import 'package:flutter/material.dart';
import '../services/community_socket_service.dart';

class CommunityScreen extends StatefulWidget {
  final String subjectId;
  const CommunityScreen({super.key, required this.subjectId});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  late final CommunitySocketService _socket;
  final List<CommunityMessage> _messages = [];

  @override
  void initState() {
    super.initState();

    _socket = CommunitySocketService(
      // عنوان الـ API بدون /api في النهاية
      baseUrl: 'https://your-api-domain.replit.app',

      // أعد توكن الوصول من خدمة المصادقة لديك
      tokenProvider: () async => await AuthService.instance.getAccessToken(),

      // رسالة جديدة وصلت
      onMessage: (msg) {
        if (!mounted) return;
        setState(() {
          // تجنّب التكرار عند إعادة جلب السجل
          if (!_messages.any((m) => m.id == msg.id)) {
            _messages.insert(0, msg); // أحدث الرسائل في الأعلى
          }
        });
      },

      // رسالة حُذفت
      onDeleted: (id, subjectId) {
        if (!mounted) return;
        setState(() => _messages.removeWhere((m) => m.id == id));
      },

      // جلب السجل عبر REST (للتحميل الأول وبعد إعادة الاتصال)
      onFetchHistory: (subjectId, {after}) async {
        final resp = await ApiClient.instance.get(
          '/api/community/$subjectId/messages',
          queryParameters: after != null
              ? {'before': after.toIso8601String()} // REST يدعم before فقط
              : null,
        );
        return (resp.data as List)
            .map((e) => CommunityMessage.fromJson(e as Map<String, dynamic>))
            .toList();
      },

      // حالة الاتصال (اختياري — للـ UI)
      onStateChange: (state) {
        if (!mounted) return;
        setState(() {}); // أعد البناء لتحديث شارة الاتصال مثلاً
      },
    );

    _initSocket();
  }

  Future<void> _initSocket() async {
    await _socket.connect();
    await _socket.joinSubject(widget.subjectId);
  }

  @override
  void dispose() {
    _socket.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('مجتمع المادة'),
        actions: [
          // شارة حالة الاتصال
          Icon(
            _socket.state == SocketConnectionState.connected
                ? Icons.wifi
                : Icons.wifi_off,
            color: _socket.state == SocketConnectionState.connected
                ? Colors.green
                : Colors.red,
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: ListView.builder(
        reverse: true,
        itemCount: _messages.length,
        itemBuilder: (ctx, i) => MessageBubble(message: _messages[i]),
      ),
    );
  }
}
```

---

## 6. إرسال رسالة (REST — لا يتغير)

إرسال الرسائل يبقى عبر REST كما هو الآن:

```dart
// رسالة نصية
await ApiClient.instance.post(
  '/api/community/${widget.subjectId}/messages',
  data: {'content': text, 'type': 'text'},
);

// رسالة بمرفق (multipart)
await ApiClient.instance.post(
  '/api/community/${widget.subjectId}/messages',
  data: FormData.fromMap({
    'type': 'image',
    'file': await MultipartFile.fromFile(filePath),
  }),
);
```

بعد الإرسال الناجح، يُذيع الخادم الرسالة تلقائياً عبر `message:new` لكل المستمعين في الغرفة — بما فيهم المرسل نفسه، لذا **لا تُضيف الرسالة يدوياً** إلى القائمة بعد الإرسال.

---

## 7. التعامل مع إعادة الاتصال

`CommunitySocketService` يتعامل مع إعادة الاتصال تلقائياً:
1. عند قطع الاتصال يُعيد المحاولة تلقائياً (exponential back-off).
2. بعد نجاح إعادة الاتصال يُعيد الانضمام للغرفة.
3. يجلب الرسائل التي ربما فاتت أثناء الانقطاع عبر REST بكل ما هو بعد `lastMessageCreatedAt`.

> **ملاحظة:** REST endpoint يدعم `before` للتصفّح للخلف، لكنه لا يدعم `after` مباشرةً. عند إعادة الاتصال، جلب أحدث رسالة ومقارنتها بآخر `createdAt` معروف يكفي عملياً لأن الانقطاعات القصيرة نادراً ما تُفوّت أكثر من صفحة.

---

## 8. الإعدادات البيئية

| البيئة | baseUrl |
|--------|---------|
| التطوير المحلي | `http://10.0.2.2:3000` (محاكي Android) أو `http://localhost:3000` (iOS) |
| الإنتاج | `https://<domain>.replit.app` أو نطاقك المخصص |

يُنصح بتخزين `baseUrl` في ملف `.env` أو `flutter_dotenv` وعدم تضمينه مباشرةً في الكود.

---

## 9. الأمان

- التوكن يُرسل فقط في `auth` field في handshake الأولي — **لا** يظهر في أي URL.
- الخادم يتحقق من التوكن فور الاتصال ويقطعه فوراً إذا كان غير صالح.
- عند انتهاء صلاحية التوكن وإعادة الاتصال، استدعِ `dispose()` ثم `connect()` مجدداً بعد تجديد التوكن.

```dart
// مثال: تجديد التوكن عند انتهاء صلاحيته
Future<void> _reconnectWithFreshToken() async {
  await AuthService.instance.refreshToken();
  _socket.dispose();
  await _socket.connect();
  await _socket.joinSubject(widget.subjectId);
}
```
