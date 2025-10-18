import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _otpController = TextEditingController();

  bool _otpSent = false;
  bool _isLoading = false;

  final String baseUrl = "http://10.0.2.2:5234/api/Auth";

  // 🔹 Gửi OTP
  Future<void> sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showSnack('Vui lòng nhập email');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/send-otp'),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email}),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        setState(() => _otpSent = true);
        _showSnack(data['message'] ?? 'OTP đã được gửi!');
      } else {
        _showSnack(data['message'] ?? 'Gửi OTP thất bại');
      }
    } catch (e) {
      _showSnack('Không thể kết nối server: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // 🔹 Xác minh OTP & đăng ký
  Future<void> verifyOtpAndRegister() async {
    final email = _emailController.text.trim();
    final username = _usernameController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;
    final otp = _otpController.text.trim();

    if (username.isEmpty) return _showSnack('Vui lòng nhập tên người dùng');
    if (password != confirm) return _showSnack('Mật khẩu không khớp');
    if (otp.isEmpty) return _showSnack('Vui lòng nhập mã OTP');

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/verify-otp'),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "email": email,
          "otp": otp,
          "password": password,
          "username": username
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final token = data['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', token);

        _showSnack(data['message'] ?? 'Đăng ký thành công!');
        Navigator.pop(context); // Quay về trang đăng nhập
      } else {
        _showSnack(data['message'] ?? 'Lỗi xác minh OTP');
      }
    } catch (e) {
      _showSnack('Không thể kết nối tới server: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đăng ký')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            children: [
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: "Email"),
              ),
              const SizedBox(height: 10),
              if (_otpSent) ...[
                TextField(
                  controller: _usernameController,
                  decoration:
                  const InputDecoration(labelText: "Tên người dùng"),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _otpController,
                  decoration:
                  const InputDecoration(labelText: "Nhập mã OTP"),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration:
                  const InputDecoration(labelText: "Mật khẩu"),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _confirmController,
                  obscureText: true,
                  decoration:
                  const InputDecoration(labelText: "Nhập lại mật khẩu"),
                ),
              ],
              const SizedBox(height: 20),
              _isLoading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.yellow,
                ),
                onPressed:
                _otpSent ? verifyOtpAndRegister : sendOtp,
                child: Text(
                  _otpSent
                      ? "Xác nhận OTP & Đăng ký"
                      : "Gửi OTP",
                  style: const TextStyle(color: Colors.black),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
