// community_socket_service.dart
//
// خدمة البث المباشر لمجتمع المادة — تستخدم socket_io_client للاتصال
// بالـ API وتستقبل الرسائل فورياً.
//
// الاعتماديات المطلوبة في pubspec.yaml:
//   socket_io_client: ^2.0.3+1
//
// الاستخدام:
//   final svc = CommunitySocketService(
//     baseUrl: 'https://your-api-domain',
//     tokenProvider: () async => await authService.getAccessToken(),
//     onMessage: (msg) => setState(() => messages.insert(0, msg)),
//     onDeleted: (id, subjectId) => setState(() => messages.removeWhere((m) => m.id == id)),
//     onFetchHistory: (subjectId, {after}) => apiClient.getMessages(subjectId, after: after),
//   );
//   await svc.connect();
//   await svc.joinSubject('subject-uuid-here');
//   // عند الخروج من الشاشة:
//   svc.dispose();

import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;

/// شكل رسالة المجتمع كما يُرسلها الـ API.
class CommunityMessage {
  final String id;
  final String subjectId;
  final String type; // 'text' | 'image' | 'voice' | 'file'
  final String? content;
  final DateTime createdAt;
  final MessageSender sender;
  final MessageAttachment? attachment;

  const CommunityMessage({
    required this.id,
    required this.subjectId,
    required this.type,
    this.content,
    required this.createdAt,
    required this.sender,
    this.attachment,
  });

  factory CommunityMessage.fromJson(Map<String, dynamic> json) {
    return CommunityMessage(
      id: json['id'] as String,
      subjectId: json['subjectId'] as String,
      type: json['type'] as String? ?? 'text',
      content: json['content'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      sender: MessageSender.fromJson(json['sender'] as Map<String, dynamic>),
      attachment: json['attachment'] != null
          ? MessageAttachment.fromJson(json['attachment'] as Map<String, dynamic>)
          : null,
    );
  }
}

class MessageSender {
  final String id;
  final String role; // 'STUDENT' | 'TEACHER'
  final String name;
  final String? avatarUrl;

  const MessageSender({
    required this.id,
    required this.role,
    required this.name,
    this.avatarUrl,
  });

  factory MessageSender.fromJson(Map<String, dynamic> json) {
    return MessageSender(
      id: json['id'] as String,
      role: json['role'] as String,
      name: json['name'] as String? ?? 'مستخدم',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}

class MessageAttachment {
  final String id;
  final String fileName;
  final String mimeType;
  final int size; // bytes
  final String url; // relative: /api/community/attachments/:id

  const MessageAttachment({
    required this.id,
    required this.fileName,
    required this.mimeType,
    required this.size,
    required this.url,
  });

  factory MessageAttachment.fromJson(Map<String, dynamic> json) {
    return MessageAttachment(
      id: json['id'] as String,
      fileName: json['fileName'] as String,
      mimeType: json['mimeType'] as String,
      size: json['size'] as int,
      url: json['url'] as String,
    );
  }

  /// رابط كامل للمرفق
  String fullUrl(String baseUrl) => '$baseUrl$url';
}

/// حالة الاتصال بالمقبس.
enum SocketConnectionState { disconnected, connecting, connected, error }

/// خدمة البث المباشر لمجتمع مادة واحدة.
///
/// أنشئ نسخة واحدة لكل شاشة مجتمع، ثم استدعِ [dispose] عند الخروج.
class CommunitySocketService {
  /// عنوان الـ API الأساسي — بدون /api في النهاية.
  /// مثال: 'https://bina-academy.replit.app'
  final String baseUrl;

  /// دالة تُعيد توكن الوصول الحالي (تُستدعى عند كل اتصال/إعادة اتصال).
  final Future<String?> Function() tokenProvider;

  /// تُستدعى عند وصول رسالة جديدة.
  final void Function(CommunityMessage message) onMessage;

  /// تُستدعى عند حذف رسالة. [id] هو id الرسالة، [subjectId] هو id المادة.
  final void Function(String id, String subjectId) onDeleted;

  /// تُستدعى لجلب السجل عبر REST.
  /// [after] هو createdAt آخر رسالة موجودة (لجلب ما بعدها فقط عند إعادة الاتصال).
  /// إذا كان null تجلب أحدث الرسائل من البداية.
  final Future<List<CommunityMessage>> Function(
    String subjectId, {
    DateTime? after,
  }) onFetchHistory;

  /// تُستدعى عند تغيّر حالة الاتصال (اختياري، للـ UI).
  final void Function(SocketConnectionState state)? onStateChange;

  IO.Socket? _socket;
  String? _joinedSubjectId;
  DateTime? _lastMessageCreatedAt;
  SocketConnectionState _state = SocketConnectionState.disconnected;

  CommunitySocketService({
    required this.baseUrl,
    required this.tokenProvider,
    required this.onMessage,
    required this.onDeleted,
    required this.onFetchHistory,
    this.onStateChange,
  });

  SocketConnectionState get state => _state;

  // ---------------------------------------------------------------------------
  // الاتصال العام
  // ---------------------------------------------------------------------------

  /// أنشئ الاتصال بالخادم. استدعِ [joinSubject] بعدها.
  Future<void> connect() async {
    if (_socket?.connected == true) return;
    _setState(SocketConnectionState.connecting);

    final token = await tokenProvider();
    if (token == null) {
      _setState(SocketConnectionState.error);
      return;
    }

    _socket = IO.io(
      baseUrl, // المقبس يتصل بـ namespace /community
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setNamespace('/community')
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(double.infinity.toInt())
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!
      ..onConnect((_) {
        _setState(SocketConnectionState.connected);
        _onReconnected();
      })
      ..onDisconnect((_) => _setState(SocketConnectionState.disconnected))
      ..onConnectError((_) => _setState(SocketConnectionState.error))
      ..on('message:new', _handleNewMessage)
      ..on('message:deleted', _handleDeletedMessage)
      ..on('error', _handleServerError);
  }

  // ---------------------------------------------------------------------------
  // الانضمام إلى غرفة المادة
  // ---------------------------------------------------------------------------

  /// انضم إلى غرفة المادة وجلب السجل عبر REST.
  ///
  /// يجب استدعاؤها بعد [connect]. يمكن استدعاؤها من جديد
  /// عند التنقل بين المواد.
  Future<void> joinSubject(String subjectId) async {
    _joinedSubjectId = subjectId;

    // جلب السجل أولاً عبر REST
    await _fetchHistory(subjectId, after: null);

    // ثم الانضمام للغرفة إن كان المقبس متصلاً
    if (_socket?.connected == true) {
      _emitJoin(subjectId);
    }
    // إذا لم يكن متصلاً، سيُعاد الانضمام تلقائياً عبر _onReconnected()
  }

  /// غادر الغرفة الحالية (اختياري، يُستدعى تلقائياً عند [dispose]).
  void leaveSubject() {
    if (_joinedSubjectId != null && _socket?.connected == true) {
      _socket!.emit('leave', {'subjectId': _joinedSubjectId});
    }
    _joinedSubjectId = null;
    _lastMessageCreatedAt = null;
  }

  // ---------------------------------------------------------------------------
  // التنظيف
  // ---------------------------------------------------------------------------

  void dispose() {
    leaveSubject();
    _socket?.dispose();
    _socket = null;
  }

  // ---------------------------------------------------------------------------
  // الداخلية
  // ---------------------------------------------------------------------------

  void _emitJoin(String subjectId) {
    _socket!.emitWithAck('join', {'subjectId': subjectId}, ack: (response) {
      // response يُمثّل { event: 'joined'|'error', data: {...} }
      final data = response as Map<String, dynamic>?;
      if (data?['event'] == 'error') {
        // الخادم رفض الانضمام (لا اشتراك نشط مثلاً)
        _setState(SocketConnectionState.error);
      }
    });
  }

  void _onReconnected() {
    // عند إعادة الاتصال: أعد الانضمام وجلب ما فاتنا
    if (_joinedSubjectId != null) {
      _emitJoin(_joinedSubjectId!);
      _fetchHistory(_joinedSubjectId!, after: _lastMessageCreatedAt);
    }
  }

  void _handleNewMessage(dynamic data) {
    try {
      final map = _toMap(data);
      if (map == null) return;
      final msg = CommunityMessage.fromJson(map);
      // تجنّب التكرار: تجاهل الرسائل القديمة التي وصلت مرتين
      if (_lastMessageCreatedAt == null ||
          msg.createdAt.isAfter(_lastMessageCreatedAt!)) {
        _lastMessageCreatedAt = msg.createdAt;
      }
      onMessage(msg);
    } catch (_) {
      // تجاهل رسائل تالفة بصمت
    }
  }

  void _handleDeletedMessage(dynamic data) {
    try {
      final map = _toMap(data);
      if (map == null) return;
      final id = map['id'] as String;
      final subjectId = map['subjectId'] as String;
      onDeleted(id, subjectId);
    } catch (_) {}
  }

  void _handleServerError(dynamic data) {
    // يمكنك إضافة تسجيل أو إظهار رسالة للمستخدم هنا
    // مثال: logger.warning('CommunitySocket error: $data');
  }

  Future<void> _fetchHistory(String subjectId, {DateTime? after}) async {
    try {
      final messages = await onFetchHistory(subjectId, after: after);
      for (final msg in messages) {
        onMessage(msg);
        if (_lastMessageCreatedAt == null ||
            msg.createdAt.isAfter(_lastMessageCreatedAt!)) {
          _lastMessageCreatedAt = msg.createdAt;
        }
      }
    } catch (_) {
      // REST fallback فشل: الرسائل القادمة عبر المقبس كافية
    }
  }

  void _setState(SocketConnectionState newState) {
    if (_state == newState) return;
    _state = newState;
    onStateChange?.call(newState);
  }

  Map<String, dynamic>? _toMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return null;
  }
}
