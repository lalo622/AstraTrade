import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:signalr_netcore/signalr_client.dart';
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

// LƯU Ý: Không cần import các thư viện SignalR nâng cao nếu dùng cách truyền token chuẩn

class ChatDetailPage extends StatefulWidget {
  final int currentUserId;
  final int otherUserId;
  final String otherUsername;

  const ChatDetailPage({
    super.key,
    required this.currentUserId,
    required this.otherUserId,
    required this.otherUsername,
  });

  @override
  State<ChatDetailPage> createState() => _ChatDetailPageState();
}

class _ChatDetailPageState extends State<ChatDetailPage> {
  final String _baseUrl = "http://10.0.2.2:5234";
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late HubConnection _hubConnection;
  List<dynamic> _messages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    await _fetchMessages();
    await _initSignalR();
    _scrollToBottom();
  }

  Future<void> _fetchMessages() async {
    final token = await SessionManager.getToken();

    if (token == null || token.isEmpty) {
      print('Lỗi: Không tìm thấy Token. Không thể tải tin nhắn.');
      setState(() => _isLoading = false);
      return;
    }

    // API C# Controller: GET: api/Chat/messages/{otherUserId}?currentUserId={currentUserId}
    final url =
        '$_baseUrl/api/Chat/messages/${widget.otherUserId}?currentUserId=${widget.currentUserId}';

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
          _messages = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        print('Lỗi tải tin nhắn: ${response.statusCode} - ${response.body}');
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('Exception khi tải tin nhắn: $e');
      setState(() => _isLoading = false);
    }
  }

  // Khởi tạo kết nối SignalR và truyền Token JWT
  Future<void> _initSignalR() async {
    final token = await SessionManager.getToken();
    final hubUrl = '$_baseUrl/chatHub';

    if (token == null || token.isEmpty) {
      print("Lỗi: Không tìm thấy Token. Không thể kết nối SignalR.");
      return;
    }

    _hubConnection = HubConnectionBuilder()
        .withUrl(
      hubUrl,
      options: HttpConnectionOptions(
        // Cách chuẩn để truyền Token JWT
        accessTokenFactory: () => Future.value(token),
      ),
    )
        .build();

    // Thiết lập các sự kiện
    _hubConnection.onclose(({Exception? error}) => print("Kết nối SignalR đã đóng: $error"));
    _hubConnection.on('ReceiveMessage', _onReceiveMessage);

    try {
      await _hubConnection.start();
      print("Kết nối SignalR thành công!");
    } catch (e) {
      print("Lỗi kết nối SignalR: $e");
    }
  }

  void _onReceiveMessage(List<Object?>? arguments) {
    if (arguments != null && arguments.isNotEmpty) {
      // Dữ liệu từ SignalR là một Map<String, dynamic>
      final messageResponse = arguments.first as Map<String, dynamic>;

      // Chỉ thêm tin nhắn nếu nó thuộc về hội thoại hiện tại
      final isIncoming = messageResponse['senderID'] == widget.otherUserId &&
          messageResponse['receiverID'] == widget.currentUserId;
      final isOutgoing = messageResponse['senderID'] == widget.currentUserId &&
          messageResponse['receiverID'] == widget.otherUserId;

      if (isIncoming || isOutgoing) {
        setState(() {
          _messages.add(messageResponse);
        });
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage({String? message, String? imageUrl}) async {
    // Không gửi nếu cả tin nhắn và ảnh đều rỗng
    if ((message == null || message.trim().isEmpty) && imageUrl == null) return;

    final token = await SessionManager.getToken();

    if (token == null || token.isEmpty) {
      print('Lỗi: Không tìm thấy Token. Không thể gửi tin nhắn.');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập lại để gửi tin nhắn.')),
      );
      return;
    }

    final url = '$_baseUrl/api/Chat/send';

    final body = json.encode({
      'SenderID': widget.currentUserId,
      'ReceiverID': widget.otherUserId,
      'Message': message ?? "",
      'ImageUrl': imageUrl,
    });

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: body,
      );

      if (response.statusCode == 200) {
        // Clear input sau khi gửi thành công
        _messageController.clear();
      } else {
        print('Lỗi gửi tin nhắn: ${response.statusCode} - ${response.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi gửi tin nhắn: ${response.statusCode}')),
        );
      }
    } catch (e) {
      print('Exception khi gửi tin nhắn: $e');
    }
  }

  // Upload ảnh lên API C#
  Future<String?> _uploadImage(File imageFile) async {
    final token = await SessionManager.getToken();

    if (token == null || token.isEmpty) {
      print('Lỗi: Không tìm thấy Token. Không thể upload ảnh.');
      return null;
    }

    final url = '$_baseUrl/api/Chat/upload-image';

    try {
      var request = http.MultipartRequest('POST', Uri.parse(url));
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(
        await http.MultipartFile.fromPath(
          'file',
          imageFile.path,
        ),
      );

      var response = await request.send();

      if (response.statusCode == 200) {
        final responseBody = await response.stream.bytesToString();
        final jsonResponse = json.decode(responseBody);
        return jsonResponse['imageUrl'];
      } else {
        print('Lỗi upload ảnh: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Exception khi upload ảnh: $e');
      return null;
    }
  }

  Future<void> _pickAndSendImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      // Hiển thị loading
      final snackBar = SnackBar(content: Text('Đang tải ảnh lên...'), duration: Duration(seconds: 15));
      ScaffoldMessenger.of(context).showSnackBar(snackBar);

      final imageUrl = await _uploadImage(File(image.path));
      ScaffoldMessenger.of(context).hideCurrentSnackBar(); // Ẩn loading

      if (imageUrl != null) {
        await _sendMessage(imageUrl: imageUrl);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tải ảnh thất bại. Vui lòng thử lại.')),
        );
      }
    }
  }

  @override
  void dispose() {
    // Ngừng kết nối SignalR khi màn hình bị hủy
    if (mounted && _hubConnection.state != HubConnectionState.Disconnected) {
      _hubConnection.stop();
    }
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.otherUsername),
        backgroundColor: Colors.yellow,
      ),
      body: Column(
        children: <Widget>[
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(10.0),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isSender =
                    message['senderID'] == widget.currentUserId;
                return _buildMessage(message, isSender);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessage(dynamic message, bool isSender) {
    // Chuyển đổi chuỗi thời gian sang đối tượng DateTime
    final dateTimeString = message['dateTime'] as String;
    final dateTime = DateTime.tryParse(dateTimeString) ?? DateTime.now();
    final formattedTime =
    TimeOfDay.fromDateTime(dateTime).format(context);

    Widget content;
    final imageUrl = message['imageUrl'] as String?;
    final messageText = message['message'] as String?;

    // Xử lý nội dung tin nhắn (ảnh hoặc văn bản)
    if (imageUrl != null && imageUrl.isNotEmpty) {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (messageText != null && messageText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child:
              Text(messageText, style: const TextStyle(color: Colors.white)),
            ),
          // Sử dụng Image.network để hiển thị ảnh
          Image.network(
            imageUrl,
            width: 200,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) =>
                Container(
                  width: 200,
                  height: 100,
                  color: Colors.grey.shade300,
                  child: const Center(child: Text("Lỗi tải ảnh")),
                ),
          ),
        ],
      );
    } else {
      content = Text(
        messageText ?? "",
        style: const TextStyle(color: Colors.white),
      );
    }

    return Align(
      alignment:
      isSender ? Alignment.centerRight : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: Column(
          crossAxisAlignment:
          isSender ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.7),
              decoration: BoxDecoration(
                color: isSender ? Colors.teal : Colors.grey[600],
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isSender
                      ? const Radius.circular(16)
                      : const Radius.circular(4),
                  bottomRight: isSender
                      ? const Radius.circular(4)
                      : const Radius.circular(16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: content,
            ),
            Padding(
              padding:
              const EdgeInsets.symmetric(horizontal: 4.0, vertical: 2.0),
              child: Text(
                formattedTime,
                style: TextStyle(fontSize: 10, color: Colors.grey[600]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding:
      const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
      color: Colors.white,
      child: Row(
        children: <Widget>[
          // Nút chọn ảnh
          IconButton(
            icon:
            const Icon(Icons.photo_library, color: Colors.blue),
            onPressed: _pickAndSendImage,
          ),
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'Nhập tin nhắn...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey[200],
                contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              // Gửi tin nhắn khi nhấn Enter/Done trên bàn phím
              onSubmitted: (_) =>
                  _sendMessage(message: _messageController.text),
            ),
          ),
          // Nút gửi tin nhắn
          IconButton(
            icon: const Icon(Icons.send, color: Colors.teal),
            onPressed: () =>
                _sendMessage(message: _messageController.text),
          ),
        ],
      ),
    );
  }
}