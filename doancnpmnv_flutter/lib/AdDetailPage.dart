import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class AdDetailPage extends StatefulWidget {
  final Map<String, dynamic> ad;

  const AdDetailPage({super.key, required this.ad});

  @override
  State<AdDetailPage> createState() => _AdDetailPageState();
}

class _AdDetailPageState extends State<AdDetailPage> {
  List<dynamic> feedbacks = [];
  bool isLoading = false;
  double averageRating = 0.0;
  final TextEditingController _commentController = TextEditingController();
  int _rating = 5;

  @override
  void initState() {
    super.initState();
    fetchFeedbacks();
  }

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

    final response = await http.post(
      Uri.parse("http://10.0.2.2:5234/api/Feedback"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "score": _rating,
        "comment": _commentController.text.trim(),
        "userID": 1, // Tạm thời mock user ID
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

  @override
  Widget build(BuildContext context) {
    final ad = widget.ad;
    final imageUrl = ad["image"] != null
        ? "http://10.0.2.2:5234${ad["image"]}"
        : "https://via.placeholder.com/300";

    return Scaffold(
      appBar: AppBar(
        title: Text(ad["title"] ?? "Chi tiết bài đăng"),
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
