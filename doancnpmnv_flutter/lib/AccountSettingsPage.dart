import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'ChangePasswordPage.dart';

class AccountSettingsPage extends StatefulWidget {
  final int userId;

  const AccountSettingsPage({super.key, required this.userId});

  @override
  State<AccountSettingsPage> createState() => _AccountSettingsPageState();
}

class _AccountSettingsPageState extends State<AccountSettingsPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  bool isLoading = true;
  bool isUpdating = false;

  @override
  void initState() {
    super.initState();
    fetchUserInfo();
  }

  // 🟢 Lấy thông tin user
  Future<void> fetchUserInfo() async {
    try {
      final url = Uri.parse("http://10.0.2.2:5234/api/auth/user/${widget.userId}");
      final res = await http.get(url);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _nameController.text = data['username'] ?? '';
          _emailController.text = data['email'] ?? '';
          _phoneController.text = data['phone'] ?? '';
          _addressController.text = data['address'] ?? '';
          isLoading = false;
        });
      } else {
        throw Exception('Lỗi tải thông tin');
      }
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Không tải được thông tin tài khoản")),
      );
    }
  }

  // 🟡 Cập nhật thông tin user (đã fix lỗi 400)
  Future<void> updateUserInfo() async {
    setState(() => isUpdating = true);
    try {
      final url = Uri.parse("http://10.0.2.2:5234/api/auth/update/${widget.userId}");

      final body = {
        'userID': widget.userId,
        'username': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'address': _addressController.text.trim(),
        'password': null,
        'isActivated': true,
        'isVIP': false,
        'role': 'Member'
      };

      print("📤 Request body: ${jsonEncode(body)}");

      final res = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      print("📥 Response (${res.statusCode}): ${res.body}");

      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("✅ Cập nhật thành công!")),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("❌ Cập nhật thất bại (${res.statusCode})")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Lỗi khi cập nhật thông tin")),
      );
    } finally {
      setState(() => isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Cài đặt tài khoản"),
        backgroundColor: Colors.teal,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTextField(_nameController, "Tên người dùng", Icons.person),
            const SizedBox(height: 10),
            _buildTextField(_emailController, "Email", Icons.email),
            const SizedBox(height: 10),
            _buildTextField(_phoneController, "Số điện thoại", Icons.phone),
            const SizedBox(height: 10),
            _buildTextField(_addressController, "Địa chỉ", Icons.home),
            const SizedBox(height: 20),

            ElevatedButton.icon(
              onPressed: isUpdating ? null : updateUserInfo,
              icon: const Icon(Icons.save),
              label: Text(isUpdating ? "Đang lưu..." : "Lưu thay đổi"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),

            const SizedBox(height: 20),

            OutlinedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChangePasswordPage(userId: widget.userId),
                  ),
                );
              },
              icon: const Icon(Icons.lock_outline),
              label: const Text("Đổi mật khẩu"),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget helper để tạo TextField
  Widget _buildTextField(TextEditingController controller, String label, IconData icon) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.teal),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
