import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart'; // Đảm bảo import SessionManager

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
  bool _hasReported = false; // Trạng thái báo cáo

  // 🛠️ THAY THẾ MOCK DATA BẰNG DỮ LIỆU THỰC TẾ TỪ SESSION
  int? _currentUserID;
  String? _jwtToken;

  @override
  void initState() {
    super.initState();
    _loadUserData(); // Tải UserID và Token khi khởi tạo
    fetchFeedbacks();
  }

  // Hàm tải UserID và Token từ SessionManager
  Future<void> _loadUserData() async {
    final userId = await SessionManager.getUserId();
    final token = await SessionManager.getToken();

    setState(() {
      _currentUserID = userId;
      _jwtToken = token;
    });

    // Sau khi có UserID và Token, mới kiểm tra trạng thái báo cáo
    if (_currentUserID != null && _jwtToken != null) {
      checkIfReported();
    }
  }

  // --- Logic API Feedback (Không cần Auth) ---

  Future<void> fetchFeedbacks() async {
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

    // ⚠️ Dùng _currentUserID để gửi feedback (Nếu userID là bắt buộc trong API này)
    if (_currentUserID == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập để gửi đánh giá.")),
      );
      return;
    }

    final response = await http.post(
      Uri.parse("http://10.0.2.2:5234/api/Feedback"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "score": _rating,
        "comment": _commentController.text.trim(),
        "userID": _currentUserID, // Dùng UserID thực tế
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

  // --- Logic API Report (CẦN SỬ DỤNG AUTH) ---

  // 1. Kiểm tra xem người dùng đã báo cáo bài đăng này chưa
  Future<void> checkIfReported() async {
    // 🛑 Kiểm tra UserID và Token trước khi gọi API có Auth
    if (_currentUserID == null || _jwtToken == null) {
      debugPrint("Yêu cầu đăng nhập để kiểm tra trạng thái báo cáo.");
      return;
    }

    final adId = widget.ad['advertisementID'];
    // Dùng _currentUserID và _jwtToken
    final url = "http://10.0.2.2:5234/api/Report/check/$adId?userId=$_currentUserID";

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          "Authorization": "Bearer $_jwtToken", // Dùng Token thực tế
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

  // 2. Gửi báo cáo lên API
  Future<void> sendReport(String reason, String reportType) async {
    // 🛑 Kiểm tra UserID và Token trước khi gọi API có Auth
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
          "Authorization": "Bearer $_jwtToken", // Dùng Token thực tế
        },
        body: jsonEncode({
          "userID": _currentUserID, // Dùng UserID thực tế
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

  // 3. Hàm hiển thị Dialog để nhập thông tin báo cáo
  void _showReportDialog() {
    // 🛑 Kiểm tra chưa đăng nhập thì không cho mở dialog
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

  // --- UI Build ---

  @override
  Widget build(BuildContext context) {
    final ad = widget.ad;
    final imageUrl = ad["image"] != null
        ? "http://10.0.2.2:5234${ad["image"]}"
        : "https://via.placeholder.com/300";

    // Quyết định xem nút Report có hiển thị không
    // Chỉ hiển thị nếu người dùng đã đăng nhập (_currentUserID != null) VÀ chưa báo cáo
    final shouldShowReportButton = _currentUserID != null && !_hasReported;
    // Nút đã bị báo cáo chỉ hiển thị nếu đã đăng nhập và đã báo cáo
    final shouldShowReportedStatus = _currentUserID != null && _hasReported;


    return Scaffold(
      appBar: AppBar(
        title: Text(ad["title"] ?? "Chi tiết bài đăng"),
        actions: [
          // Hiển thị nút Báo cáo nếu chưa báo cáo và đã đăng nhập
          if (shouldShowReportButton)
            IconButton(
              icon: const Icon(Icons.flag_outlined, color: Colors.red),
              tooltip: "Báo cáo bài đăng",
              onPressed: _showReportDialog, // Gọi Dialog báo cáo
            )
          else if (shouldShowReportedStatus)
          // Hiển thị trạng thái đã báo cáo
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
            // Ảnh bài đăng
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

            // Thông tin bài đăng
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
            const SizedBox(height: 16),
            const Divider(),

            // ⭐ Tổng quan đánh giá
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

            // Bình luận
            const Text(
              "Bình luận & đánh giá",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            // Nhập bình luận
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

            // Danh sách feedback
            isLoading
                ? const Center(child: CircularProgressIndicator())
                : feedbacks.isEmpty
                ? const Text("Chưa có bình luận nào.")
                : Column(
              children: feedbacks.map((f) {
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