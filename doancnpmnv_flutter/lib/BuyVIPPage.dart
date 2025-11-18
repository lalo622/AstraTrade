import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class BuyVIPPage extends StatefulWidget {
  final int userId;
  const BuyVIPPage({super.key, required this.userId});

  @override
  State<BuyVIPPage> createState() => _BuyVIPPageState();
}

class _BuyVIPPageState extends State<BuyVIPPage> {
  List packages = [];
  bool loading = true;

  // ✅ Đổi IP: emulator không gọi được 127.0.0.1 → dùng 10.0.2.2
  final String baseUrl = "http://10.0.2.2:5234/api/payment";

  @override
  void initState() {
    super.initState();
    fetchPackages();
  }

  Future<void> fetchPackages() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/packages'));
      if (res.statusCode == 200) {
        setState(() {
          packages = json.decode(res.body);
          loading = false;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không tải được danh sách gói VIP (${res.statusCode})')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối server: $e')),
      );
    }
  }

  Future<void> buyPackage(int packageId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/create-payment-url'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userID': widget.userId,
          'packageID': packageId,
        }),
      );

      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final url = data['paymentUrl'];
        if (url != null && url.isNotEmpty) {
          final uri = Uri.parse(url);
          // ✅ Dùng externalApplication để mở Chrome
          final launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );
          if (!launched) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Không thể mở trang thanh toán')),
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không nhận được URL thanh toán')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thanh toán thất bại')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi khi tạo thanh toán: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mua gói VIP')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
        itemCount: packages.length,
        itemBuilder: (context, index) {
          final p = packages[index];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text(
                p['name'],
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text('Giá: ${p['price']} VNĐ | Thời hạn: ${p['duration']} ngày'),
              trailing: ElevatedButton(
                onPressed: () => buyPackage(p['packageID']),
                child: const Text('Mua ngay'),
              ),
            ),
          );
        },
      ),
    );
  }
}
