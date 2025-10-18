import 'package:flutter/material.dart';
import '../services/category_service.dart';

class AdminCategoryPage extends StatefulWidget {
  const AdminCategoryPage({super.key});

  @override
  State<AdminCategoryPage> createState() => _AdminCategoryPageState();
}

class _AdminCategoryPageState extends State<AdminCategoryPage> {
  List<dynamic> categories = [];
  bool isLoading = true;
  final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadCategories();
  }

  Future<void> loadCategories() async {
    setState(() => isLoading = true);
    try {
      categories = await CategoryService.getAllCategories();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Lỗi: $e")),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  void showCategoryDialog({int? id, String? name}) {
    _nameController.text = name ?? "";
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(id == null ? "Thêm danh mục" : "Sửa danh mục"),
        content: TextField(
          controller: _nameController,
          decoration: const InputDecoration(labelText: "Tên danh mục"),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Hủy"),
          ),
          ElevatedButton(
            onPressed: () async {
              String message;
              if (id == null) {
                message = await CategoryService.addCategory(_nameController.text);
              } else {
                message = await CategoryService.updateCategory(id, _nameController.text);
              }

              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
              loadCategories();
            },
            child: const Text("Lưu"),
          ),
        ],
      ),
    );
  }

  void confirmDelete(int id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Xác nhận xóa"),
        content: const Text("Bạn có chắc muốn xóa danh mục này không?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Hủy")),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              String msg = await CategoryService.deleteCategory(id);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
              loadCategories();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Xóa"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Quản lý danh mục")),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: loadCategories,
        child: ListView.builder(
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final c = categories[index];
            return ListTile(
              title: Text(c['name']),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue),
                    onPressed: () => showCategoryDialog(id: c['categoryID'], name: c['name']),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () => confirmDelete(c['categoryID']),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showCategoryDialog(),
        backgroundColor: Colors.yellow,
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
