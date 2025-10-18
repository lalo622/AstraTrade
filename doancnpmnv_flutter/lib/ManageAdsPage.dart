import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'PostAdPage.dart';

class ManageAdsPage extends StatefulWidget {
  const ManageAdsPage({super.key});

  @override
  State<ManageAdsPage> createState() => _ManageAdsPageState();
}

class _ManageAdsPageState extends State<ManageAdsPage> {
  List<dynamic> ads = [];
  bool isLoading = true;
  String selectedStatus = "Active";
  Map<String, int> counts = {"Active": 0, "Inactive": 0, "Deleted": 0};

  Future<void> _confirmDelete(int adId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Xóa tin"),
        content: const Text("Bạn có chắc chắn muốn xóa tin này không?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Hủy"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Xóa", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _deleteAd(adId);
    }
  }

  Future<void> _deleteAd(int adId) async {
    try {
      final response = await http.delete(
        Uri.parse('http://10.0.2.2:5234/api/Advertisement/$adId'),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Đã xóa tin thành công")),
        );
        fetchAds(); // ✅ reload lại danh sách
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Xóa thất bại")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Lỗi: $e")),
      );
    }
  }


  // ✅ Tính thời gian đăng (dạng: 5 phút / 2 giờ / 3 ngày trước)
  String timeAgo(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final diff = DateTime.now().difference(date);

      if (diff.inMinutes < 1) return "Vừa xong";
      if (diff.inMinutes < 60) return "${diff.inMinutes} phút trước";
      if (diff.inHours < 24) return "${diff.inHours} giờ trước";
      if (diff.inDays < 7) return "${diff.inDays} ngày trước";
      if (diff.inDays < 30) return "${(diff.inDays / 7).floor()} tuần trước";
      if (diff.inDays < 365) return "${(diff.inDays / 30).floor()} tháng trước";
      return "${(diff.inDays / 365).floor()} năm trước";
    } catch (e) {
      return "";
    }
  }

  @override
  void initState() {
    super.initState();
    fetchAds();
  }

  Future<void> fetchAds() async {
    setState(() => isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('user_id') ?? 0;

      final response = await http.get(
        Uri.parse(
            'http://10.0.2.2:5234/api/Advertisement/user-ads-byid?userId=$userId'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          ads = data["ads"];
          counts = {
            "Active": data["counts"]["Active"] ?? 0,
            "Inactive": data["counts"]["Inactive"] ?? 0,
            "Deleted": data["counts"]["Deleted"] ?? 0,
          };
        });
      }
    } catch (e) {
      print("Lỗi fetch ads: $e");
    } finally {
      setState(() => isLoading = false);
    }
  }

  String formatCurrency(dynamic price) {
    final formatter = NumberFormat('#,###', 'vi_VN');
    return "${formatter.format(price ?? 0)} đ";
  }

  @override
  Widget build(BuildContext context) {
    final statusOptions = [
      {"key": "Active", "label": "Đang hoạt động", "color": Colors.green},
      {"key": "Inactive", "label": "Đang ẩn", "color": Colors.orange},
      {"key": "Deleted", "label": "Đã xóa", "color": Colors.red},
    ];

    final filteredAds =
    ads.where((a) => a["status"] == selectedStatus).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Quản lý tin"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: fetchAds,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
        children: [
          // ✅ Thanh trạng thái
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(8),
            child: Row(
              children: statusOptions.map((status) {
                final isSelected = selectedStatus == status["key"];
                final color = status["color"] as Color;
                return GestureDetector(
                  onTap: () =>
                      setState(() => selectedStatus = status["key"] as String),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? color.withOpacity(0.15)
                          : Colors.grey[200],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color:
                        isSelected ? color : Colors.grey.shade400,
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.circle, size: 10, color: color),
                        const SizedBox(width: 6),
                        Text(
                          "${status["label"]} (${counts[status["key"]] ?? 0})",
                          style: TextStyle(
                            color:
                            isSelected ? color : Colors.black87,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // ✅ Hiển thị danh sách tin
          Expanded(
            child: filteredAds.isEmpty
                ? const Center(
                child: Text("Không có tin nào trong mục này."))
                : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate:
              const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.65,
              ),
              itemCount: filteredAds.length,
              itemBuilder: (context, index) {
                final ad = filteredAds[index];
                final imageUrl = ad['image'];
                final title = ad['title'] ?? '';
                final description = ad['description'] ?? '';
                final price = ad['price'] ?? 0;
                final adId = ad['advertisementID'];
                final postDate = ad['postDate']; // ✅ dùng postDate

                return GestureDetector(
                  onTap: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            PostAdPage(adToEdit: ad),
                      ),
                    );
                    if (result == true) fetchAds();
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.2),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment:
                      CrossAxisAlignment.start,
                      children: [
                        // ✅ Hình ảnh (giữ khung)
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius:
                              const BorderRadius.vertical(
                                  top:
                                  Radius.circular(12)),
                              child: Container(
                                height: 130,
                                width: double.infinity,
                                color: Colors.grey[200],
                                child: imageUrl != null &&
                                    imageUrl
                                        .toString()
                                        .isNotEmpty
                                    ? Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context,
                                      error, stackTrace) {
                                    return const Center(
                                      child: Icon(
                                        Icons
                                            .image_not_supported,
                                        size: 40,
                                        color: Colors.grey,
                                      ),
                                    );
                                  },
                                )
                                    : const Center(
                                  child: Icon(
                                    Icons
                                        .image_not_supported,
                                    size: 40,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ),

                            // 🕒 Thời gian đăng
                            if (postDate != null)
                              Positioned(
                                left: 8,
                                bottom: 8,
                                child: Container(
                                  padding:
                                  const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.black54,
                                    borderRadius:
                                    BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    timeAgo(postDate),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight:
                                      FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ),

                            const Positioned(
                              right: 8,
                              top: 8,
                              child: Icon(Icons.favorite_border,
                                  color: Colors.white),
                            ),
                          ],
                        ),

                        // ✅ Nội dung
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Column(
                            crossAxisAlignment:
                            CrossAxisAlignment.start,
                            children: [
                              Text(
                                title.toUpperCase(),
                                maxLines: 2,
                                overflow:
                                TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                description,
                                maxLines: 1,
                                overflow:
                                TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                formatCurrency(price),
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (selectedStatus == "Active") // ✅ chỉ hiện khi đang ở tab 'Đang hoạt động'
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red),
                                    onPressed: () => _confirmDelete(adId),
                                  ),
                                ),

                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
