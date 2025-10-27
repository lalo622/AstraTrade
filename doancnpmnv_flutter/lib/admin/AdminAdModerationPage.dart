import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class AdminAdModerationPage extends StatefulWidget {
  const AdminAdModerationPage({super.key});

  @override
  State<AdminAdModerationPage> createState() => _AdminAdModerationPageState();
}

class _AdminAdModerationPageState extends State<AdminAdModerationPage> {
  List<dynamic> pendingAds = [];
  bool isLoading = false;

  static const String baseUrl = 'http://10.0.2.2:5234/api/admin/admoderation';

  @override
  void initState() {
    super.initState();
    fetchPendingAds();
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> fetchPendingAds() async {
    setState(() => isLoading = true);
    try {
      final res = await http.get(Uri.parse('$baseUrl/pending'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          pendingAds = data['items'] ?? [];
        });
      } else {
        _showSnack('Lỗi tải danh sách tin: ${res.statusCode}');
      }
    } catch (e) {
      _showSnack('Lỗi kết nối server');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> approveAd(int adId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/approve'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'advertisementID': adId}),
      );
      if (res.statusCode == 200) {
        _showSnack('✅ Đã duyệt tin thành công!');
        fetchPendingAds();
      } else {
        _showSnack('❌ Duyệt tin thất bại (${res.statusCode})');
      }
    } catch (e) {
      _showSnack('Lỗi khi duyệt tin');
    }
  }

  Future<void> rejectAd(int adId) async {
    final TextEditingController reasonCtrl = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Từ chối tin đăng"),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: "Lý do từ chối",
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Hủy"),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final res = await http.post(
                  Uri.parse('$baseUrl/reject'),
                  headers: {'Content-Type': 'application/json'},
                  body: jsonEncode({
                    'advertisementID': adId,
                    'rejectionReason': reasonCtrl.text,
                  }),
                );

                if (res.statusCode == 200) {
                  _showSnack('🚫 Đã từ chối tin thành công!');
                  fetchPendingAds();
                } else {
                  _showSnack('Từ chối thất bại (${res.statusCode})');
                }
              } catch (e) {
                _showSnack('Lỗi khi từ chối tin');
              }
            },
            child: const Text("Xác nhận"),
          ),
        ],
      ),
    );
  }

  // ✅ Hàm hiển thị ảnh base64 hoặc URL
  Widget _buildImage(dynamic imgData) {
    const baseUrl = 'http://10.0.2.2:5234'; // Emulator Android

    if (imgData == null || imgData.toString().isEmpty) {
      return Image.asset(
        'assets/images/placeholder.jpg',
        width: 110,
        height: 110,
        fit: BoxFit.cover,
      );
    }

    String imageUrl = imgData.toString();

    // Nếu chỉ có đường dẫn /uploads/... thì nối baseUrl
    if (imageUrl.startsWith('/uploads')) {
      imageUrl = '$baseUrl$imageUrl';
    }

    if (imageUrl.startsWith('http')) {
      return Image.network(
        imageUrl,
        width: 110,
        height: 110,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Image.asset(
          'assets/images/placeholder.jpg',
          width: 110,
          height: 110,
        ),
      );
    }

    return Image.asset(
      'assets/images/placeholder.jpg',
      width: 110,
      height: 110,
      fit: BoxFit.cover,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('🧩 Quản lý tin Member'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: fetchPendingAds,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : pendingAds.isEmpty
          ? const Center(child: Text('Không có tin nào chờ duyệt'))
          : ListView.builder(
        padding: const EdgeInsets.all(10),
        itemCount: pendingAds.length,
        itemBuilder: (context, index) {
          final ad = pendingAds[index];
          final image = (ad['images'] != null && ad['images'].isNotEmpty)
              ? ad['images'][0]
              : null;

          final id = ad['id'] ?? ad['advertisementID'];
          final adId = int.tryParse(id?.toString() ?? '');

          return Card(
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            elevation: 3,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: InkWell(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: Text(ad['title'] ?? 'Chi tiết tin'),
                    content: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildImage(image),
                          const SizedBox(height: 10),
                          Text(ad['description'] ?? 'Không có mô tả',
                              style: const TextStyle(fontSize: 15)),
                          const SizedBox(height: 10),
                          Text("Giá: ${ad['price'] ?? '0'} VNĐ",
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold)),
                          Text("Người đăng: ${ad['postedBy'] ?? 'Không rõ'}"),
                          Text("Ngày đăng: ${ad['createdDate'] ?? ''}"),
                        ],
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text("Đóng"),
                      )
                    ],
                  ),
                );
              },
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      bottomLeft: Radius.circular(12),
                    ),
                    child: _buildImage(image),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(ad['title'] ?? 'Không có tiêu đề',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16)),
                          const SizedBox(height: 6),
                          Text(ad['description'] ?? 'Không có mô tả',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.black54)),
                          const SizedBox(height: 8),
                          Text("👤 ${ad['postedBy'] ?? 'Không rõ'}",
                              style: const TextStyle(fontSize: 13)),
                          Text("📅 ${ad['createdDate'] ?? ''}",
                              style: const TextStyle(fontSize: 13)),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              ElevatedButton.icon(
                                icon: const Icon(Icons.check),
                                label: const Text("Duyệt"),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  minimumSize: const Size(90, 36),
                                ),
                                onPressed: adId == null
                                    ? null
                                    : () => approveAd(adId),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton.icon(
                                icon: const Icon(Icons.close),
                                label: const Text("Từ chối"),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                  minimumSize: const Size(90, 36),
                                ),
                                onPressed: adId == null
                                    ? null
                                    : () => rejectAd(adId),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
