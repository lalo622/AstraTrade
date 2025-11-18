import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart';

class PostAdPage extends StatefulWidget {
  const PostAdPage({super.key});

  @override
  State<PostAdPage> createState() => _PostAdPageState();
}

class _PostAdPageState extends State<PostAdPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();

  int? _selectedCategoryId;
  String? _selectedAdType = 'Sell';
  List<dynamic> _categories = [];

  File? _selectedImage;
  bool _isLoading = false;

  final String baseUrl = "http://10.0.2.2:5234/api/Advertisement"; // ⚙️ Đổi IP khi deploy

  @override
  void initState() {
    super.initState();
    fetchCategories();
  }

  Future<void> fetchCategories() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/categories'));
      if (response.statusCode == 200) {
        setState(() {
          _categories = jsonDecode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Lỗi khi tải danh mục: $e');
    }
  }

  Future<void> pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
      });
    }
  }

  Future<String?> uploadImage(File imageFile) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload-image'));
      request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));
      var response = await request.send();

      if (response.statusCode == 200) {
        final respStr = await response.stream.bytesToString();
        final data = jsonDecode(respStr);
        return data['imageUrl'];
      } else {
        debugPrint('Upload ảnh thất bại: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Lỗi upload ảnh: $e');
      return null;
    }
  }

  Future<void> postAd() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true); // show overlay

    final userId = await SessionManager.getUserId();
    if (userId == null || userId <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng đăng nhập trước khi đăng tin")),
      );
      setState(() => _isLoading = false);
      return;
    }

    String? imageUrl;
    if (_selectedImage != null) {
      imageUrl = await uploadImage(_selectedImage!);
      if (imageUrl == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Không thể upload ảnh")),
        );
        setState(() => _isLoading = false);
        return;
      }
    }

    final adData = {
      "title": _titleController.text.trim(),
      "description": _descController.text.trim(),
      "price": double.tryParse(_priceController.text.trim()) ?? 0,
      "adType": _selectedAdType,
      "image": imageUrl,
      "userID": userId,
      "categoryID": _selectedCategoryId,
    };

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/post-ad'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(adData),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? "Đăng tin thành công!"),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        final data = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? "Đăng tin thất bại"),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } catch (e) {
      debugPrint("Lỗi đăng tin: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Lỗi kết nối server")),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Đăng tin mới", style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.yellow,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Tiêu đề", style: TextStyle(fontWeight: FontWeight.bold)),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(hintText: "Nhập tiêu đề tin..."),
                    validator: (val) => val == null || val.isEmpty ? "Vui lòng nhập tiêu đề" : null,
                  ),
                  const SizedBox(height: 15),
                  const Text("Mô tả", style: TextStyle(fontWeight: FontWeight.bold)),
                  TextFormField(
                    controller: _descController,
                    maxLines: 5,
                    decoration: const InputDecoration(hintText: "Nhập mô tả chi tiết..."),
                  ),
                  const SizedBox(height: 15),
                  const Text("Giá", style: TextStyle(fontWeight: FontWeight.bold)),
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: "VD: 1500000"),
                  ),
                  const SizedBox(height: 15),
                  const Text("Danh mục", style: TextStyle(fontWeight: FontWeight.bold)),
                  DropdownButtonFormField<int>(
                    value: _selectedCategoryId,
                    items: _categories
                        .map((c) => DropdownMenuItem<int>(
                      value: c['categoryID'],
                      child: Text(c['name']),
                    ))
                        .toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedCategoryId = val;
                      });
                    },
                    decoration: const InputDecoration(hintText: "Chọn danh mục"),
                    validator: (val) => val == null ? "Vui lòng chọn danh mục" : null,
                  ),
                  const SizedBox(height: 15),
                  const Text("Loại tin", style: TextStyle(fontWeight: FontWeight.bold)),
                  DropdownButtonFormField<String>(
                    value: _selectedAdType,
                    items: const [
                      DropdownMenuItem(value: 'Sell', child: Text("Bán")),
                      DropdownMenuItem(value: 'Buy', child: Text("Mua")),
                      DropdownMenuItem(value: 'Service', child: Text("Dịch vụ")),
                    ],
                    onChanged: (val) => setState(() => _selectedAdType = val),
                  ),
                  const SizedBox(height: 15),
                  const Text("Ảnh sản phẩm", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: pickImage,
                    child: _selectedImage == null
                        ? Container(
                      height: 180,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.grey[200],
                        border: Border.all(color: Colors.grey),
                      ),
                      child: const Center(
                        child: Icon(Icons.add_a_photo_outlined, color: Colors.grey, size: 50),
                      ),
                    )
                        : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        _selectedImage!,
                        height: 180,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 25),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.yellow,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: _isLoading ? null : postAd,
                      icon: _isLoading
                          ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                          : const Icon(Icons.send),
                      label: Text(
                        _isLoading ? "Đang đăng..." : "Đăng tin",
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black45,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }
}
