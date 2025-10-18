import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PostAdPage extends StatefulWidget {
  final Map<String, dynamic>? adToEdit;
  const PostAdPage({super.key, this.adToEdit});

  @override
  State<PostAdPage> createState() => _PostAdPageState();
}

class _PostAdPageState extends State<PostAdPage> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();

  String? selectedCategory;
  String adType = "Sell";
  List<dynamic> categories = [];
  File? selectedImage;
  String? uploadedImageUrl;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    fetchCategories().then((_) {
      if (widget.adToEdit != null) loadAdToEdit(widget.adToEdit!);
    });
  }

  void loadAdToEdit(Map<String, dynamic> ad) {
    _titleController.text = ad['title'] ?? '';
    _descController.text = ad['description'] ?? '';
    _priceController.text = ad['price']?.toString() ?? '';
    adType = ad['adType'] ?? "Sell";
    selectedCategory = ad['categoryID']?.toString();
    uploadedImageUrl = ad['image'];
  }

  Future<void> fetchCategories() async {
    try {
      final response = await http.get(Uri.parse('http://10.0.2.2:5234/api/Advertisement/categories'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() => categories = data);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Không thể tải danh mục: $e")),
      );
    }
  }

  Future<void> pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);
    if (pickedFile != null) {
      setState(() => selectedImage = File(pickedFile.path));
      await uploadImage(selectedImage!);
    }
  }

  Future<void> uploadImage(File imageFile) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('http://10.0.2.2:5234/api/Advertisement/upload-image'),
      );
      request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final response = await request.send();
      final respStr = await response.stream.bytesToString();

      if (response.statusCode == 200) {
        final data = jsonDecode(respStr);
        setState(() => uploadedImageUrl = data['imageUrl']);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Tải ảnh thành công")),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Upload thất bại: ${response.statusCode}")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Lỗi upload ảnh: $e")),
      );
    }
  }

  Future<void> postAd() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();
    final price = double.tryParse(_priceController.text.trim()) ?? 0;

    if (title.isEmpty || selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng nhập tiêu đề và chọn danh mục")),
      );
      return;
    }

    if (uploadedImageUrl == null || uploadedImageUrl!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng tải lên ít nhất 1 ảnh")),
      );
      return;
    }

    setState(() => isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('user_id');

      final body = jsonEncode({
        "title": title,
        "description": desc,
        "price": price,
        "adType": adType,
        "categoryID": int.parse(selectedCategory!),
        "userID": userId,
        "image": uploadedImageUrl,
      });

      final url = widget.adToEdit != null
          ? 'http://10.0.2.2:5234/api/Advertisement/update-ad/${widget.adToEdit!['advertisementID']}'
          : 'http://10.0.2.2:5234/api/Advertisement/post-ad';

      final response = await http.post(
        Uri.parse(url),
        headers: {"Content-Type": "application/json"},
        body: body,
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? "Thành công")),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? "Thất bại")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Lỗi kết nối: $e")),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.adToEdit != null;

    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? "Sửa tin" : "Đăng tin mới")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(controller: _titleController, decoration: const InputDecoration(labelText: "Tiêu đề")),
            const SizedBox(height: 10),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(labelText: "Mô tả"),
              maxLines: 3,
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _priceController,
              decoration: const InputDecoration(labelText: "Giá"),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: selectedCategory,
              hint: const Text("Chọn danh mục"),
              items: categories.map((c) {
                return DropdownMenuItem(
                  value: c['categoryID'].toString(),
                  child: Text(c['name']),
                );
              }).toList(),
              onChanged: (v) => setState(() => selectedCategory = v),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: adType,
              items: ["Sell", "Buy", "Rent", "Service"]
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => setState(() => adType = v ?? "Sell"),
              decoration: const InputDecoration(labelText: "Loại tin"),
            ),
            const SizedBox(height: 10),
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: selectedImage != null
                  ? Image.file(selectedImage!, fit: BoxFit.cover)
                  : (uploadedImageUrl != null && uploadedImageUrl!.isNotEmpty)
                  ? Image.network('http://10.0.2.2:5234$uploadedImageUrl', fit: BoxFit.cover)
                  : const Center(child: Text("Chưa chọn ảnh")),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: () => pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo),
                  label: const Text("Gallery"),
                ),
                const SizedBox(width: 10),
                ElevatedButton.icon(
                  onPressed: () => pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Camera"),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: isLoading ? null : postAd,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: Colors.yellow,
              ),
              child: isLoading
                  ? const CircularProgressIndicator(color: Colors.black)
                  : Text(
                isEdit ? "Cập nhật tin" : "Đăng tin",
                style: const TextStyle(color: Colors.black, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
