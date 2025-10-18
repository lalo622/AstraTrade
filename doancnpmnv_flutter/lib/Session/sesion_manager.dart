import 'package:shared_preferences/shared_preferences.dart';

class SessionManager {
  static Future<void> saveUser({
    required String email,
    required String token,
    required int userId,
    required String role, // thêm dòng này
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_email', email);
    await prefs.setString('jwt_token', token);
    await prefs.setInt('user_id', userId);
    await prefs.setString('user_role', role); // thêm dòng này
  }

  static Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_email');
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  static Future<int?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_id');
  }

  static Future<String?> getUserRole() async { // thêm hàm này
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_role');
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
