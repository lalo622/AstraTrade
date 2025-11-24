import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'ChangePasswordPage.dart'; // Giả sử tồn tại

class AccountSettingsPage extends StatefulWidget {
  final int userId;
  // TODO: Truyền Token JWT vào nếu API yêu cầu xác thực
  // final String jwtToken;

  const AccountSettingsPage({super.key, required this.userId});

  @override
  State<AccountSettingsPage> createState() => _AccountSettingsPageState();
}

class _AccountSettingsPageState extends State<AccountSettingsPage> {
  // Giữ lại các controller cho giao diện, nhưng sẽ không load/update nếu API không hỗ trợ
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

  // 🟢 Lấy thông tin user (Sử dụng endpoint 'profile/{userId}' và chỉ lấy các trường có sẵn)
  Future<void> fetchUserInfo() async {
    setState(() => isLoading = true);
    try {
      // Đổi URL từ user/{userId} sang profile/{userId}
      final url = Uri.parse("http://10.0.2.2:5234/api/auth/profile/${widget.userId}");

      // TODO: Thêm headers cho xác thực JWT nếu cần
      final res = await http.get(url);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          // Lấy các trường có trong Controller C# của bạn
          _nameController.text = data['username'] ?? '';
          _emailController.text = data['email'] ?? '';

          // Các trường phone/address không có trong phản hồi profile/{userId}, giữ trống
          _phoneController.text = ''; // API không trả về
          _addressController.text = ''; // API không trả về

          isLoading = false;
        });
      } else {
        throw Exception('Lỗi tải thông tin: ${res.statusCode} ${res.body}');
      }
    } catch (e) {
      print("Lỗi khi tải thông tin: $e");
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ Không tải được thông tin tài khoản: $e")),
      );
    }
  }

  // 🟡 Cập nhật thông tin user (CHÚ Ý: Controller C# của bạn CHƯA có endpoint này)
  // Nếu bạn đã thêm endpoint [HttpPut("profile/{userId}")] trong C# với Model đầy đủ
  Future<void> updateUserInfo() async {
    // ⚠️ CHÚ Ý: Endpoint update của bạn phải chấp nhận các trường sau:
    // userID, username, email, phone, address, password, isActivated, isVIP, role
    // Nếu bạn không có endpoint cập nhật, hàm này sẽ báo lỗi 404 hoặc 405.

    // Nếu bạn muốn dùng endpoint của mình, bạn phải tạo thêm endpoint PUT trong C# Controller
    // và đảm bảo nó chấp nhận User model đầy đủ (bao gồm phone, address, và các trường cần thiết khác)

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("⚠️ Chức năng cập nhật chưa được hỗ trợ bởi Controller.")),
    );
    // Để tránh lỗi tạm thời, mình chỉ báo lỗi, bạn cần triển khai endpoint C# phù hợp
    // setState(() => isUpdating = true);
    // try {
    //   final url = Uri.parse("http://10.0.2.2:5234/api/auth/profile/${widget.userId}"); // Giả sử đây là endpoint PUT

    //   final body = {
    //     'userID': widget.userId,
    //     'username': _nameController.text.trim(),
    //     'email': _emailController.text.trim(),
    //     'phone': _phoneController.text.trim(), // Nếu C# Model có
    //     'address': _addressController.text.trim(), // Nếu C# Model có
    //     'password': null, // Không nên cập nhật mật khẩu ở đây
    //     'isActivated': true,
    //     'isVIP': false,
    //     'role': 'Member'
    //   };

    //   print("📤 Request body: ${jsonEncode(body)}");

    //   final res = await http.put(
    //     url,
    //     headers: {'Content-Type': 'application/json'},
    //     body: jsonEncode(body),
    //   );

    //   print("📥 Response (${res.statusCode}): ${res.body}");

    //   if (res.statusCode == 200) {
    //     ScaffoldMessenger.of(context).showSnackBar(
    //       const SnackBar(content: Text("✅ Cập nhật thành công!")),
    //     );
    //   } else {
    //     ScaffoldMessenger.of(context).showSnackBar(
    //       SnackBar(content: Text("❌ Cập nhật thất bại (${res.statusCode}): ${res.body}")),
    //     );
    //   }
    // } catch (e) {
    //   ScaffoldMessenger.of(context).showSnackBar(
    //     SnackBar(content: Text("❌ Lỗi khi cập nhật thông tin: $e")),
    //   );
    // } finally {
    //   setState(() => isUpdating = false);
    // }
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
            _buildTextField(_nameController, "Tên người dùng", Icons.person, enabled: true), // Cho phép chỉnh sửa
            const SizedBox(height: 10),
            _buildTextField(_emailController, "Email", Icons.email, enabled: false), // Không cho phép chỉnh sửa Email
            const SizedBox(height: 10),
            _buildTextField(_phoneController, "Số điện thoại (Chưa hỗ trợ)", Icons.phone, enabled: false),
            const SizedBox(height: 10),
            _buildTextField(_addressController, "Địa chỉ (Chưa hỗ trợ)", Icons.home, enabled: false),
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
  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {bool enabled = true}) {
    return TextField(
      controller: controller,
      enabled: enabled, // Kiểm soát khả năng chỉnh sửa
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.teal),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}