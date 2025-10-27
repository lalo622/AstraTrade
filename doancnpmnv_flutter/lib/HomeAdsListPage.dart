import 'dart:convert';
import 'package:doancnpmnv_flutter/AdDetailPage.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart';

class HomeAdsListPage extends StatefulWidget {
  const HomeAdsListPage({super.key});

  @override
  State<HomeAdsListPage> createState() => _HomeAdsListPageState();
}

class _HomeAdsListPageState extends State<HomeAdsListPage> {
  List<dynamic> ads = [];
  Set<int> favoriteAdIds = {}; // ⭐ Lưu danh sách id tin yêu thích
  bool isLoading = false;
  String? errorMessage;
  int? userId;
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, dynamic>> categories = [
    {'icon': Icons.home, 'label': 'Bất động sản'},
    {'icon': Icons.directions_car, 'label': 'Xe cộ'},
    {'icon': Icons.pets, 'label': 'Thú cưng'},
    {'icon': Icons.chair_alt, 'label': 'Nội thất'},
    {'icon': Icons.work, 'label': 'Việc làm'},
    {'icon': Icons.phone_iphone, 'label': 'Điện tử'},
    {'icon': Icons.kitchen, 'label': 'Đồ gia dụng'},
    {'icon': Icons.local_offer, 'label': 'Thời trang'},
  ];

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    final uid = await SessionManager.getUserId();
    setState(() {
      userId = uid;
    });
    await fetchAllActiveAds();
    if (uid != null) await fetchFavorites(uid);
  }

  // 🔹 Lấy danh sách tin đang hoạt động
  Future<void> fetchAllActiveAds() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response =
      await http.get(Uri.parse("http://10.0.2.2:5234/api/Advertisement/all"));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) {
          setState(() => ads = data);
        } else {
          setState(() => errorMessage = "Dữ liệu không đúng định dạng.");
        }
      } else {
        setState(() => errorMessage = "Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      setState(() => errorMessage = "Lỗi tải dữ liệu: $e");
    } finally {
      setState(() => isLoading = false);
    }
  }

  // 🔹 Lấy danh sách yêu thích
  Future<void> fetchFavorites(int uid) async {
    try {
      final res = await http.get(Uri.parse("http://10.0.2.2:5234/api/favorite/user/$uid"));
      if (res.statusCode == 200) {
        final data = json.decode(res.body) as List;
        setState(() {
          favoriteAdIds = data.map((f) => f["advertisementID"] as int).toSet();
        });
      }
    } catch (e) {
      print("Lỗi tải yêu thích: $e");
    }
  }

  // ❤️ Thêm / xóa yêu thích
  Future<void> toggleFavorite(int adId) async {
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập để thêm yêu thích")),
      );
      return;
    }

    final isFav = favoriteAdIds.contains(adId);

    try {
      if (isFav) {
        // ❌ Gọi API xóa
        final res = await http.delete(
          Uri.parse("http://10.0.2.2:5234/api/favorite/remove?userId=$userId&adId=$adId"),
        );
        if (res.statusCode == 200) {
          setState(() => favoriteAdIds.remove(adId));
        }
      } else {
        // ✅ Gọi API thêm
        final res = await http.post(
          Uri.parse("http://10.0.2.2:5234/api/favorite/add"),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            "userID": userId,
            "advertisementID": adId,
          }),
        );
        if (res.statusCode == 200) {
          setState(() => favoriteAdIds.add(adId));
        }
      }
    } catch (e) {
      print("Lỗi toggle yêu thích: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: RefreshIndicator(
        onRefresh: fetchAllActiveAds,
        child: CustomScrollView(
          slivers: [
            // 🟡 Header
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
                decoration: const BoxDecoration(
                  color: Colors.yellow,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(30),
                    bottomRight: Radius.circular(30),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 40),
                    const Text("Bạn muốn mua gì?",
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.black)),
                    const SizedBox(height: 4),
                    const Text("Chợ Tốt muốn là có.",
                        style: TextStyle(color: Colors.black54, fontSize: 15)),
                    const SizedBox(height: 16),

                    // 🔍 Thanh tìm kiếm
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 5,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search, color: Colors.grey),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _searchController,
                              decoration: const InputDecoration(
                                hintText: "Tìm sản phẩm...",
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 🧩 Danh mục
                    SizedBox(
                      height: 95,
                      child: GridView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: categories.length,
                        gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 1,
                          mainAxisSpacing: 16,
                          childAspectRatio: 1,
                        ),
                        itemBuilder: (context, index) {
                          final item = categories[index];
                          return Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircleAvatar(
                                radius: 25,
                                backgroundColor: Colors.white,
                                child: Icon(item['icon'],
                                    color: Colors.amber[700], size: 26),
                              ),
                              const SizedBox(height: 6),
                              Text(item['label'],
                                  style: const TextStyle(fontSize: 12)),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 📰 Danh sách bài đăng
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: const [
                    Text("Dành cho bạn",
                        style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),

            if (isLoading)
              const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()))
            else if (errorMessage != null)
              SliverFillRemaining(child: Center(child: Text(errorMessage!)))
            else if (ads.isEmpty)
                const SliverFillRemaining(
                    child: Center(child: Text("Chưa có bài đăng nào.")))
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  sliver: SliverGrid(
                    delegate: SliverChildBuilderDelegate(
                          (context, index) {
                        final ad = ads[index];
                        final imageUrl = ad["image"] != null
                            ? "http://10.0.2.2:5234${ad["image"]}"
                            : "https://via.placeholder.com/200";
                        final adId = ad["advertisementID"] as int;
                        final isFav = favoriteAdIds.contains(adId);

                        return Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 3,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => AdDetailPage(ad: ad)),
                              );
                            },
                            child: Stack(
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // 🖼️ Ảnh + icon ❤️
                                    Stack(
                                      children: [
                                        ClipRRect(
                                          borderRadius:
                                          const BorderRadius.vertical(
                                              top: Radius.circular(12)),
                                          child: Image.network(
                                            imageUrl,
                                            height: 120,
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                        Positioned(
                                          top: 6,
                                          right: 6,
                                          child: GestureDetector(
                                            onTap: () => toggleFavorite(adId),
                                            child: CircleAvatar(
                                              radius: 16,
                                              backgroundColor:
                                              Colors.white.withOpacity(0.8),
                                              child: Icon(
                                                isFav
                                                    ? Icons.favorite
                                                    : Icons.favorite_border,
                                                color: isFav
                                                    ? Colors.red
                                                    : Colors.grey[600],
                                                size: 20,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    // 📝 Nội dung
                                    Padding(
                                      padding: const EdgeInsets.all(8.0),
                                      child: Column(
                                        crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                        children: [
                                          Text(ad["title"] ?? "",
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold)),
                                          const SizedBox(height: 4),
                                          Text("${ad["price"] ?? 0} đ",
                                              style: const TextStyle(
                                                  color: Colors.pink,
                                                  fontWeight: FontWeight.bold)),
                                          const SizedBox(height: 4),
                                          Text(ad["categoryName"] ?? "",
                                              style: const TextStyle(
                                                  color: Colors.grey,
                                                  fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      childCount: ads.length,
                    ),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.68,
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
