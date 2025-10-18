import 'dart:convert';
import 'package:http/http.dart' as http;

class CategoryService {
  static const String baseUrl = "http://10.0.2.2:5234/api/Admin/Category";

  // Lấy tất cả danh mục
  static Future<List<dynamic>> getAllCategories() async {
    final response = await http.get(Uri.parse(baseUrl));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Không thể tải danh mục");
    }
  }

  // Thêm danh mục
  static Future<String> addCategory(String name) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"name": name}),
    );

    if (response.statusCode == 201) {
      return "Thêm danh mục thành công!";
    } else {
      final data = jsonDecode(response.body);
      return data['message'] ?? "Lỗi khi thêm danh mục";
    }
  }

  // Cập nhật danh mục
  static Future<String> updateCategory(int id, String name) async {
    final response = await http.put(
      Uri.parse("$baseUrl/$id"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"categoryID": id, "name": name}),
    );

    if (response.statusCode == 204) {
      return "Cập nhật thành công!";
    } else {
      final data = jsonDecode(response.body);
      return data['message'] ?? "Lỗi khi cập nhật danh mục";
    }
  }

  // Xóa danh mục
  static Future<String> deleteCategory(int id) async {
    final response = await http.delete(Uri.parse("$baseUrl/$id"));

    if (response.statusCode == 204) {
      return "Xóa danh mục thành công!";
    } else {
      final data = jsonDecode(response.body);
      return data['message'] ?? "Không thể xóa danh mục.";
    }
  }
}
