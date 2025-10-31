import 'dart:convert';
import 'package:http/http.dart' as http;

class PackageService {
  static const String baseUrl = "http://10.0.2.2:5234/api/admin/packages"; // chỉnh IP nếu dùng thật

  static Future<List<dynamic>> getAllPackages() async {
    final res = await http.get(Uri.parse(baseUrl));
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    } else {
      throw Exception("Lỗi tải danh sách gói: ${res.body}");
    }
  }

  static Future<String> addPackage(String name, double price, int duration) async {
    final res = await http.post(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'price': price, 'duration': duration}),
    );
    if (res.statusCode == 201) return "Thêm gói thành công";
    return "Lỗi thêm gói: ${res.body}";
  }

  static Future<String> updatePackage(int id, String name, double price, int duration) async {
    final res = await http.put(
      Uri.parse("$baseUrl/$id"),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'price': price, 'duration': duration}),
    );
    if (res.statusCode == 200) return "Cập nhật thành công";
    return "Lỗi cập nhật: ${res.body}";
  }

  static Future<String> deletePackage(int id) async {
    final res = await http.delete(Uri.parse("$baseUrl/$id"));
    if (res.statusCode == 204) return "Xóa thành công";
    return "Lỗi xóa: ${res.body}";
  }

  static Future<Map<String, dynamic>> checkUsage(int id) async {
    final res = await http.get(Uri.parse("$baseUrl/$id/check-usage"));
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    } else {
      throw Exception("Lỗi kiểm tra sử dụng: ${res.body}");
    }
  }
}
