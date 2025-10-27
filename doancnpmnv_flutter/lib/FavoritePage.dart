import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class FavoritePage extends StatefulWidget {
  final int userId;

  const FavoritePage({super.key, required this.userId});

  @override
  State<FavoritePage> createState() => _FavoritePageState();
}

class _FavoritePageState extends State<FavoritePage> {
  List<dynamic> favoriteAds = [];
  bool isLoading = false;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    fetchFavorites();
  }

  // 🔹 Lấy danh sách yêu thích
  Future<void> fetchFavorites() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await http.get(
        Uri.parse("http://10.0.2.2:5234/api/favorite/user/${widget.userId}"),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          favoriteAds = data;
        });
      } else {
        setState(() {
          errorMessage = "Lỗi server: ${response.statusCode}";
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = "Lỗi tải dữ liệu: $e";
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  // ❤️ Xoá yêu thích
  Future<void> removeFavorite(int adId) async {
    try {
      final response = await http.delete(
        Uri.parse(
            "http://10.0.2.2:5234/api/favorite/remove?userId=${widget.userId}&adId=$adId"),
      );

      print("Xoá yêu thích: ${response.statusCode} - ${response.body}");

      if (response.statusCode == 200) {
        setState(() {
          favoriteAds.removeWhere((ad) => ad["advertisementID"] == adId);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Đã xoá khỏi danh sách yêu thích")),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Không thể xoá: ${response.statusCode}")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Lỗi xoá: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Yêu thích của tôi ❤️"),
        backgroundColor: Colors.amber,
        centerTitle: true,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
          ? Center(child: Text(errorMessage!))
          : favoriteAds.isEmpty
          ? const Center(
        child: Text(
          "Chưa có sản phẩm yêu thích",
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      )
          : RefreshIndicator(
        onRefresh: fetchFavorites,
        child: ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: favoriteAds.length,
          itemBuilder: (context, index) {
            final ad = favoriteAds[index];

            final String imageUrl = ad["image"] != null
                ? (ad["image"].toString().startsWith("http")
                ? ad["image"]
                : "http://10.0.2.2:5234${ad["image"]}")
                : "https://via.placeholder.com/200";

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(15),
                        bottomLeft: Radius.circular(15),
                      ),
                      child: Image.network(
                        imageUrl,
                        width: 110,
                        height: 110,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 110,
                          height: 110,
                          color: Colors.grey[300],
                          child: const Icon(
                            Icons.image_not_supported,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 8),
                        child: Column(
                          crossAxisAlignment:
                          CrossAxisAlignment.start,
                          children: [
                            Text(
                              ad["title"] ?? "Không có tiêu đề",
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              "${ad["price"]?.toString() ?? "0"} VNĐ",
                              style: const TextStyle(
                                color: Colors.pink,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Align(
                              alignment: Alignment.centerRight,
                              child: IconButton(
                                icon: const Icon(
                                  Icons.favorite,
                                  color: Colors.redAccent,
                                ),
                                onPressed: () => removeFavorite(
                                    ad["advertisementID"]),
                              ),
                            )
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
      ),
    );
  }
}
