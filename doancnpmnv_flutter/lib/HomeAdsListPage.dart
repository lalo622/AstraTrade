import 'dart:convert';
import 'package:doancnpmnv_flutter/AdDetailPage.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;


class HomeAdsListPage extends StatefulWidget {
  const HomeAdsListPage({super.key});

  @override
  State<HomeAdsListPage> createState() => _HomeAdsListPageState();
}

class _HomeAdsListPageState extends State<HomeAdsListPage> {
  List<dynamic> ads = [];
  bool isLoading = false;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    fetchAllActiveAds();
  }

  Future<void> fetchAllActiveAds() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await http.get(
        Uri.parse("http://10.0.2.2:5234/api/Advertisement/all"),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data is List) {
          setState(() {
            ads = List.from(data);
          });
        } else {
          setState(() {
            errorMessage = "Dữ liệu không đúng định dạng";
          });
        }
      } else {
        setState(() {
          errorMessage = "Lỗi load bài đăng: ${response.statusCode}";
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = "Lỗi khi lấy bài đăng: $e";
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: fetchAllActiveAds,
      child: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
          ? Center(child: Text(errorMessage!))
          : ads.isEmpty
          ? const Center(child: Text("Chưa có bài đăng nào"))
          : GridView.builder(
        padding: const EdgeInsets.all(12),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, // 2 cột
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.7, // tỉ lệ chiều rộng/chiều cao
        ),
        itemCount: ads.length,
        itemBuilder: (context, index) {
          final ad = ads[index];
          final imageUrl = ad["image"] != null
              ? "http://10.0.2.2:5234${ad["image"]}"
              : "https://via.placeholder.com/200";

          return Card(
            elevation: 3,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AdDetailPage(ad: ad),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    flex: 6,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                      ),
                      child: Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                        const Icon(Icons.image_not_supported, size: 50),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 5,
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ad["title"] ?? "",
                            style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ad["description"] ?? "",
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: Colors.black54),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Giá: ${ad["price"] ?? 0} VND",
                            style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.teal,
                                fontSize: 12),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ad["categoryName"] ?? "",
                            style: const TextStyle(
                                fontSize: 11, color: Colors.grey),
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
