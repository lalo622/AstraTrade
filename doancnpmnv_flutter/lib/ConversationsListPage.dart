import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart';
import 'package:doancnpmnv_flutter/ChatDetailPage.dart';

class ConversationListPage extends StatefulWidget {
  const ConversationListPage({super.key});

  @override
  State<ConversationListPage> createState() => _ConversationListPageState();
}

class _ConversationListPageState extends State<ConversationListPage> {
  final String _baseUrl = "http://10.0.2.2:5234";
  List<dynamic> _conversations = [];
  bool _isLoading = true;
  String _error = '';
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    final token = await SessionManager.getToken();
    final userId = await SessionManager.getUserId();

    if (token == null || token.isEmpty || userId == null || userId <= 0) {
      setState(() {
        _error = 'Vui lòng đăng nhập để xem tin nhắn.';
        _isLoading = false;
      });
      return;
    }

    _currentUserId = userId;
    final url = '$_baseUrl/api/Chat/conversations?userId=$userId';

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        setState(() {
          // Dữ liệu trả về từ API C# đã được chuẩn hóa, không cần user1/user2 phức tạp
          _conversations = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        String errorDetail = 'Lỗi không xác định.';

        if (response.statusCode == 401) {
          errorDetail = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
        } else {
          try {
            if (response.body.isNotEmpty) {
              final jsonResponse = json.decode(response.body);
              errorDetail = jsonResponse['message'] ?? response.body;
            }
          } catch (e) {
            errorDetail = response.body.isNotEmpty
                ? 'Server trả về lỗi không phải JSON. Kiểm tra log Server C#.'
                : 'Server không phản hồi nội dung.';
          }
        }

        // Cập nhật thông báo lỗi
        setState(() {
          _error = 'Lỗi khi tải danh sách hội thoại: ${response.statusCode}. Chi tiết: $errorDetail';
          print('Lỗi Server chi tiết: ${response.statusCode} - $errorDetail');
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Lỗi kết nối hoặc Exception: $e';
        _isLoading = false;
      });
    }
  }

  // Chuyển đổi chuỗi thời gian sang định dạng giờ phút (HH:mm)
  String _formatLastMessageTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tin nhắn'),
        backgroundColor: Colors.yellow,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
          ? Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Text(
            _error,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.red, fontSize: 16),
          ),
        ),
      )
          : ListView.builder(
        itemCount: _conversations.length,
        itemBuilder: (context, index) {
          final conversation = _conversations[index];

          // Dữ liệu từ API C# đã được chuẩn hóa để lấy trực tiếp
          final otherUserId = conversation['userId'] as int?;
          final otherUsername = conversation['username'] as String? ?? 'Người dùng không xác định';
          final lastMessage = conversation['lastMessage'] as String? ?? 'Chưa có tin nhắn';
          // lastMessageTime là DateTime object (hoặc chuỗi nếu API trả về chuỗi)
          final lastMessageTimeRaw = conversation['lastMessageTime'];
          DateTime? lastMessageTime;

          if (lastMessageTimeRaw is String) {
            // Cố gắng parse chuỗi thời gian
            lastMessageTime = DateTime.tryParse(lastMessageTimeRaw);
          } else if (lastMessageTimeRaw is DateTime) {
            lastMessageTime = lastMessageTimeRaw;
          }

          final formattedTime = lastMessageTime != null ? _formatLastMessageTime(lastMessageTime) : '';

          if (otherUserId == null || otherUserId == 0 || _currentUserId == null) {
            return const SizedBox.shrink(); // Bỏ qua item lỗi
          }

          return ListTile(
            leading: const CircleAvatar(
              child: Icon(Icons.person),
            ),
            title: Text(otherUsername),
            subtitle: Text(lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis),
            trailing: Text(formattedTime),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ChatDetailPage(
                    currentUserId: _currentUserId!,
                    otherUserId: otherUserId,
                    otherUsername: otherUsername,
                  ),
                ),
              ).then((_) => _loadConversations()); // Tải lại danh sách sau khi quay lại
            },
          );
        },
      ),
    );
  }
}