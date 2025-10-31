import 'package:flutter/material.dart';
import '../services/package_service.dart';

class AdminPackagePage extends StatefulWidget {
  const AdminPackagePage({super.key});

  @override
  State<AdminPackagePage> createState() => _AdminPackagePageState();
}

class _AdminPackagePageState extends State<AdminPackagePage> {
  List<dynamic> packages = [];
  bool isLoading = true;

  final _nameCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadPackages();
  }

  Future<void> loadPackages() async {
    setState(() => isLoading = true);
    try {
      packages = await PackageService.getAllPackages();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Lỗi: $e")));
    } finally {
      setState(() => isLoading = false);
    }
  }

  void showPackageDialog({int? id, String? name, double? price, int? duration}) {
    _nameCtrl.text = name ?? "";
    _priceCtrl.text = price?.toString() ?? "";
    _durationCtrl.text = duration?.toString() ?? "";

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(id == null ? "Thêm gói mới" : "Cập nhật gói"),
        content: SingleChildScrollView(
          child: Column(
            children: [
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: "Tên gói"),
              ),
              TextField(
                controller: _priceCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: "Giá (VNĐ)"),
              ),
              TextField(
                controller: _durationCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: "Thời hạn (ngày)"),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Hủy")),
          ElevatedButton(
            onPressed: () async {
              final name = _nameCtrl.text.trim();
              final price = double.tryParse(_priceCtrl.text.trim()) ?? 0;
              final duration = int.tryParse(_durationCtrl.text.trim()) ?? 0;

              String msg;
              if (id == null) {
                msg = await PackageService.addPackage(name, price, duration);
              } else {
                msg = await PackageService.updatePackage(id, name, price, duration);
              }

              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
              loadPackages();
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
      builder: (_) => AlertDialog(
        title: const Text("Xác nhận xóa"),
        content: const Text("Bạn có chắc chắn muốn xóa gói này không?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Hủy")),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final msg = await PackageService.deletePackage(id);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
              loadPackages();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Xóa"),
          ),
        ],
      ),
    );
  }

  void showUsage(int id) async {
    try {
      final result = await PackageService.checkUsage(id);
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Thông tin sử dụng"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("Mã gói: ${result['packageID']}"),
              Text("Đang được sử dụng: ${result['isInUse'] ? "Có" : "Không"}"),
              Text("Số người dùng: ${result['userCount']}"),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text("Đóng"))
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Lỗi: $e")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Quản lý gói đăng tin"),
        centerTitle: true,
        backgroundColor: Colors.blueAccent,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: loadPackages,
        child: ListView.builder(
          padding: const EdgeInsets.all(10),
          itemCount: packages.length,
          itemBuilder: (context, index) {
            final p = packages[index];
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 8),
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                title: Text(
                  p['name'],
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                subtitle: Text(
                  "Giá: ${p['price']} VNĐ\nThời hạn: ${p['duration']} ngày",
                  style: const TextStyle(height: 1.4),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.info, color: Colors.teal),
                      tooltip: "Kiểm tra sử dụng",
                      onPressed: () => showUsage(p['packageID']),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit, color: Colors.blue),
                      onPressed: () => showPackageDialog(
                        id: p['packageID'],
                        name: p['name'],
                        price: (p['price'] as num).toDouble(),
                        duration: p['duration'],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () => confirmDelete(p['packageID']),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showPackageDialog(),
        backgroundColor: Colors.yellow,
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
