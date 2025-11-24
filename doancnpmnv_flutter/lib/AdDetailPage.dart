import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart';
import 'package:doancnpmnv_flutter/ChatDetailPage.dart'; // Đảm bảo đã import

class AdDetailPage extends StatefulWidget {
  final Map<String, dynamic> ad;

  const AdDetailPage({super.key, required this.ad});

  @override
  State<AdDetailPage> createState() => _AdDetailPageState();
}

class _AdDetailPageState extends State<AdDetailPage> {
  // State & Controllers cho Feedback
  List<dynamic> feedbacks = [];
  bool isLoading = false;
  double averageRating = 0.0;
  final TextEditingController _commentController = TextEditingController();
  int _rating = 5;

  // State & Controllers cho Report
  bool _hasReported = false;

  int? _currentUserID;
  String? _jwtToken;

  // ⭐ THÊM STATE MỚI ĐỂ LƯU CHI TIẾT ĐẦY ĐỦ VÀ TRẠNG THÁI LOADING
  Map<String, dynamic>? _adData;
  bool _isAdDataLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchAdDetails(); // ⭐ GỌI HÀM MỚI TẠI ĐÂY
    fetchFeedbacks();
  }

  // Hàm tải UserID và Token từ SessionManager (Giữ nguyên)
  Future<void> _loadUserData() async {
    final userId = await SessionManager.getUserId();
    final token = await SessionManager.getToken();

    setState(() {
      _currentUserID = userId;
      _jwtToken = token;
    });

    if (_currentUserID != null && _jwtToken != null) {
      checkIfReported();
    }
  }

  // ⭐ HÀM MỚI: Tải chi tiết tin đăng để lấy UserID và UserName đầy đủ
  Future<void> _fetchAdDetails() async {
    setState(() => _isAdDataLoading = true);
    try {
      final response = await http.get(
        Uri.parse("http://10.0.2.2:5234/api/Advertisement/${widget.ad['advertisementID']}"),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _adData = data as Map<String, dynamic>;
        });
        debugPrint('Tải chi tiết tin thành công. UserID người bán: ${_adData!['userID']}');
      } else {
        debugPrint("Lỗi tải chi tiết tin: ${response.body}");
        // Giữ lại dữ liệu ban đầu (widget.ad) nếu không tải được
        setState(() => _adData = widget.ad);
      }
    } catch (e) {
      debugPrint("Lỗi kết nối tải chi tiết tin: $e");
      // Giữ lại dữ liệu ban đầu (widget.ad) nếu bị lỗi kết nối
      setState(() => _adData = widget.ad);
    } finally {
      setState(() => _isAdDataLoading = false);
    }
  }

  // --- Logic API Feedback, Report (Giữ nguyên) ---

  Future<void> fetchFeedbacks() async {
    // Logic fetchFeedbacks (Giữ nguyên)
    setState(() => isLoading = true);
    try {
      final response = await http.get(Uri.parse(
          "http://10.0.2.2:5234/api/Feedback/ad/${widget.ad['advertisementID']}"));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) {
          double avg = 0;
          if (data.isNotEmpty) {
            final total = data.fold<double>(
              0,
                  (sum, f) => sum + (f["score"] ?? 0).toDouble(),
            );
            avg = total / data.length;
          }

          setState(() {
            feedbacks = data;
            averageRating = avg;
          });
        }
      }
    } catch (e) {
      debugPrint("Lỗi lấy feedback: $e");
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> addFeedback() async {
    if (_commentController.text.trim().isEmpty) return;

    if (_currentUserID == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập để gửi đánh giá.")),
      );
      return;
    }

    // ⭐ SỬ DỤNG KEY 'userID' từ _adData nếu có, nếu không thì dùng widget.ad (dữ liệu tạm)
    final adUserId = (_adData ?? widget.ad)["userID"] ?? (_adData ?? widget.ad)["UserID"];
    if (adUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Không tìm thấy ID tin đăng để gửi đánh giá.")),
      );
      return;
    }

    final response = await http.post(
      Uri.parse("http://10.0.2.2:5234/api/Feedback"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "score": _rating,
        "comment": _commentController.text.trim(),
        "userID": _currentUserID,
        "advertisementID": widget.ad["advertisementID"]
      }),
    );

    if (response.statusCode == 200) {
      _commentController.clear();
      fetchFeedbacks();
    } else {
      debugPrint("Lỗi gửi feedback: ${response.body}");
    }
  }

  Future<void> checkIfReported() async {
    // Logic checkIfReported (Giữ nguyên)
    if (_currentUserID == null || _jwtToken == null) {
      debugPrint("Yêu cầu đăng nhập để kiểm tra trạng thái báo cáo.");
      return;
    }

    final adId = widget.ad['advertisementID'];
    final url = "http://10.0.2.2:5234/api/Report/check/$adId?userId=$_currentUserID";

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          "Authorization": "Bearer $_jwtToken",
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map<String, dynamic> && data.containsKey('hasReported')) {
          setState(() {
            _hasReported = data['hasReported'];
          });
        }
      } else if (response.statusCode == 401) {
        debugPrint("Lỗi 401: Yêu cầu đăng nhập để kiểm tra báo cáo!");
      }
    } catch (e) {
      debugPrint("Lỗi kiểm tra trạng thái báo cáo: $e");
    }
  }

  Future<void> sendReport(String reason, String reportType) async {
    // Logic sendReport (Giữ nguyên)
    if (_currentUserID == null || _jwtToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập để gửi báo cáo.")),
      );
      return;
    }

    final adId = widget.ad['advertisementID'];
    String message;

    try {
      final response = await http.post(
        Uri.parse("http://10.0.2.2:5234/api/Report"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $_jwtToken",
        },
        body: jsonEncode({
          "userID": _currentUserID,
          "advertisementID": adId,
          "reason": reason,
          "reportType": reportType,
        }),
      );

      if (response.statusCode == 200) {
        message = json.decode(response.body)['message'] ?? "Báo cáo đã được gửi thành công!";
        setState(() => _hasReported = true);
      } else if (response.statusCode == 400) {
        message = json.decode(response.body)['message'] ?? "Bạn đã báo cáo tin đăng này rồi!";
      } else if (response.statusCode == 401) {
        message = "Lỗi xác thực (401). Vui lòng đăng nhập lại.";
      } else {
        message = "Lỗi hệ thống khi gửi báo cáo: ${response.statusCode}";
        debugPrint("Lỗi gửi báo cáo: ${response.body}");
      }
    } catch (e) {
      message = "Lỗi kết nối mạng: $e";
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _showReportDialog() {
    // Logic _showReportDialog (Giữ nguyên)
    if (_currentUserID == null || _jwtToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập để báo cáo tin đăng.")),
      );
      return;
    }

    String selectedType = "Spam";
    TextEditingController reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Báo cáo bài đăng"),
          content: StatefulBuilder(
            builder: (BuildContext context, StateSetter setStateDialog) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonFormField<String>(
                    value: selectedType,
                    decoration: const InputDecoration(labelText: "Loại báo cáo"),
                    items: ["Spam", "Scam", "Inappropriate", "Other"]
                        .map((label) => DropdownMenuItem(
                      value: label,
                      child: Text(label),
                    ))
                        .toList(),
                    onChanged: (value) {
                      setStateDialog(() {
                        selectedType = value!;
                      });
                    },
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: reasonController,
                    decoration: const InputDecoration(
                      labelText: "Lý do chi tiết",
                      hintText: "Nhập lý do càng chi tiết càng tốt...",
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                ],
              );
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Hủy"),
            ),
            ElevatedButton(
              onPressed: () {
                if (reasonController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Vui lòng nhập lý do báo cáo.")));
                  return;
                }
                Navigator.pop(context);
                sendReport(reasonController.text.trim(), selectedType);
              },
              child: const Text("Gửi báo cáo"),
            ),
          ],
        );
      },
    );
  }

  // --- LOGIC ĐIỀU HƯỚNG CHAT (Đã cập nhật để dùng _adData) ---

  void _navigateToChat() {
    // ⭐ SỬ DỤNG DỮ LIỆU ĐẦY ĐỦ NHẤT
    final ad = _adData ?? widget.ad;

    // 1. Lấy ID Người bán và ID Người dùng hiện tại
    final dynamic rawSellerId = ad['userID'] ?? ad['UserID'];
    // Lấy UserName từ dữ liệu đã được tải lại, hoặc dùng dữ liệu cũ
    final String sellerUsername = ad['userName'] ?? ad['UserName'] ?? 'Người bán';

    // 2. Kiểm tra trạng thái đăng nhập
    if (_currentUserID == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập để chat.")),
      );
      return;
    }

    // 3. Chuyển đổi ID người bán sang int an toàn
    int? sellerId;
    if (rawSellerId is int) {
      sellerId = rawSellerId;
    } else if (rawSellerId is String) {
      sellerId = int.tryParse(rawSellerId);
    }

    // 4. Kiểm tra ID Người bán hợp lệ (đã được parse và phải > 0)
    if (sellerId == null || sellerId <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Không tìm thấy thông tin người bán.")),
      );
      return;
    }

    // 5. Kiểm tra không chat với chính mình
    if (_currentUserID == sellerId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Đây là tin đăng của bạn, không thể tự chat.")),
      );
      return;
    }

    // 6. Điều hướng đến ChatDetailPage
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatDetailPage(
          currentUserId: _currentUserID!,
          otherUserId: sellerId!,
          otherUsername: sellerUsername,
        ),
      ),
    );
  }


  // --- UI Build (Đã cập nhật để dùng _adData và xử lý loading) ---

  @override
  Widget build(BuildContext context) {
    // ⭐ XỬ LÝ LOADING (Nếu đang tải dữ liệu chi tiết, hiển thị CircularProgressIndicator)
    if (_isAdDataLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text("Đang tải...")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // ⭐ SỬ DỤNG DỮ LIỆU ĐÃ TẢI XONG (_adData) hoặc DỮ LIỆU CŨ (widget.ad)
    final ad = _adData ?? widget.ad;

    // Logic lấy UserID người bán để kiểm tra nút chat
    final dynamic rawSellerId = ad['userID'] ?? ad['UserID'];
    int? sellerId;
    if (rawSellerId is int) {
      sellerId = rawSellerId;
    } else if (rawSellerId is String) {
      sellerId = int.tryParse(rawSellerId);
    }

    // Quyết định có nên hiển thị nút Chat không
    final showChatButton = _currentUserID != null && sellerId != null && _currentUserID != sellerId;

    // Các biến UI khác (Giữ nguyên)
    final imageUrl = ad["image"] != null
        ? "http://10.0.2.2:5234${ad["image"]}"
        : "https://via.placeholder.com/300";

    final shouldShowReportButton = _currentUserID != null && !_hasReported;
    final shouldShowReportedStatus = _currentUserID != null && _hasReported;


    return Scaffold(
      appBar: AppBar(
        title: Text(ad["title"] ?? "Chi tiết bài đăng"),
        actions: [
          if (shouldShowReportButton)
            IconButton(
              icon: const Icon(Icons.flag_outlined, color: Colors.red),
              tooltip: "Báo cáo bài đăng",
              onPressed: _showReportDialog,
            )
          else if (shouldShowReportedStatus)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Tooltip(
                message: "Bạn đã báo cáo tin đăng này rồi",
                child: Icon(Icons.flag_rounded, color: Colors.grey.shade500),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ảnh bài đăng (Giữ nguyên)
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                height: 220,
                width: double.infinity,
                errorBuilder: (context, error, stackTrace) =>
                    Container(
                      height: 220,
                      width: double.infinity,
                      color: Colors.grey.shade200,
                      child: const Center(child: Text("Không tải được ảnh")),
                    ),
              ),
            ),
            const SizedBox(height: 12),

            // Thông tin bài đăng (Đã dùng biến 'ad' mới)
            Text(
              ad["title"] ?? "",
              style:
              const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(ad["description"] ?? ""),
            const SizedBox(height: 10),
            Text(
              "Giá: ${ad["price"] ?? 0} VND",
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: Colors.teal),
            ),
            Text(
              "Danh mục: ${ad["categoryName"] ?? 'Không rõ'}",
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            // ⭐ Hiển thị UserName đã được tải lại
            Text(
              "Người bán: ${ad["userName"] ?? ad["UserName"] ?? 'Không rõ'}",
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),

            // 🌟 NÚT CHAT (Liên hệ Người bán)
            if (showChatButton)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.only(bottom: 16),
                child: ElevatedButton.icon(
                  onPressed: _navigateToChat,
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: const Text("Liên hệ người bán"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),

            const Divider(),

            // ⭐ Tổng quan đánh giá (Giữ nguyên)
            Row(
              children: [
                Icon(Icons.star, color: Colors.amber.shade600, size: 22),
                const SizedBox(width: 4),
                Text(
                  "${averageRating.toStringAsFixed(1)} / 5",
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                Text(
                  "(${feedbacks.length} lượt đánh giá)",
                  style: const TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Divider(),

            // Bình luận (Giữ nguyên)
            const Text(
              "Bình luận & đánh giá",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            // Nhập bình luận (Giữ nguyên)
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: const InputDecoration(
                      hintText: "Nhập bình luận...",
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<int>(
                  value: _rating,
                  items: [1, 2, 3, 4, 5]
                      .map((v) => DropdownMenuItem(
                    value: v,
                    child: Text("$v⭐"),
                  ))
                      .toList(),
                  onChanged: (v) => setState(() => _rating = v!),
                ),
                IconButton(
                  onPressed: addFeedback,
                  icon: const Icon(Icons.send, color: Colors.teal),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Danh sách feedback (Giữ nguyên)
            isLoading
                ? const Center(child: CircularProgressIndicator())
                : feedbacks.isEmpty
                ? const Text("Chưa có bình luận nào.")
                : Column(
              children: feedbacks.map((f) {
                // Ưu tiên lấy key 'userName' (camelCase)
                final userName =
                    f["userName"] ?? f["UserName"] ?? "Ẩn danh";
                final score = f["score"] ?? f["Score"] ?? 0;
                final comment =
                    f["comment"] ?? f["Comment"] ?? "";
                final date =
                    f["dateTime"] ?? f["DateTime"] ?? "";

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.teal.shade100,
                      child: Text(
                        userName[0].toUpperCase(),
                        style:
                        const TextStyle(color: Colors.teal),
                      ),
                    ),
                    title: Text(userName),
                    subtitle: Column(
                      crossAxisAlignment:
                      CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: List.generate(
                            score,
                                (i) => const Icon(Icons.star,
                                size: 14, color: Colors.amber),
                          ),
                        ),
                        Text(comment),
                        Text(
                          date,
                          style: const TextStyle(
                              fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}