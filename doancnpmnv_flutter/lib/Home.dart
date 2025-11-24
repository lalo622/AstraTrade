import 'package:doancnpmnv_flutter/AccountSettingsPage.dart';
import 'package:doancnpmnv_flutter/BuyVIPPage.dart';
import 'package:doancnpmnv_flutter/ConversationsListPage.dart';
import 'package:doancnpmnv_flutter/FavoritePage.dart';
import 'package:doancnpmnv_flutter/HomeAdsListPage.dart';
import 'package:doancnpmnv_flutter/ManageAdsPage.dart';
import 'package:doancnpmnv_flutter/PostAdPage.dart';
import 'package:doancnpmnv_flutter/admin/AdminAdModerationPage.dart';
import 'package:doancnpmnv_flutter/admin/AdminPackagePage.dart';
import 'package:flutter/material.dart';
import 'package:doancnpmnv_flutter/LoginPage.dart';
import 'package:doancnpmnv_flutter/RegisterPage.dart';
import 'package:doancnpmnv_flutter/Session/sesion_manager.dart';
import 'package:doancnpmnv_flutter/admin/admin_category_page.dart';

class Home extends StatefulWidget {
  const Home({super.key});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  int _selectedIndex = 0;
  bool isLoggedIn = false;
  String? email;
  String? role;
  int? user_id;


  final List<Widget> _pages = [];

  @override
  void initState() {
    super.initState();
    checkLogin();
    // 🌟 Khởi tạo các trang, không dùng logic isLoggedIn ở đây
    _pages.addAll([
      const HomeAdsListPage(),
      const ManageAdsPage(),
      const PostAdPage(),
      const ConversationListPage(), // Đặt ConversationListPage cố định
      _accountPage(),
    ]);
  }

  Future<void> checkLogin() async {
    final token = await SessionManager.getToken();
    final userEmail = await SessionManager.getUserEmail();
    final userRole = await SessionManager.getUserRole();
    final userid = await SessionManager.getUserId();

    setState(() {
      isLoggedIn = token != null && token.isNotEmpty; // 🌟 Thêm kiểm tra token.isNotEmpty
      email = userEmail;
      role = userRole;
      user_id = userid;
    });
  }

  Widget _accountPage() {
    if (!isLoggedIn) {
      // 🔸 Chưa đăng nhập
      return Center(
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.fromLTRB(20, 60, 20, 20),
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.3),
                  spreadRadius: 3,
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                const Text(
                  'Mua thì hời, bán thì lời.',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Đăng nhập cái đã!',
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 30),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton(
                      style: TextButton.styleFrom(foregroundColor: Colors.black),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const RegisterPage()),
                        );
                      },
                      child: const Text('Tạo tài khoản'),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.yellow,
                        foregroundColor: Colors.black,
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const LoginPage()),
                        ).then((_) => checkLogin());
                      },
                      child: const Text('Đăng nhập'),
                    ),
                  ],
                )
              ],
            ),
          ),
        ),
      );
    } else {
      // 🔸 Đã đăng nhập
      return Center(
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.fromLTRB(20, 60, 20, 20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.3),
                  spreadRadius: 3,
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Xin chào, $email',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),

                // 🔹 Nếu là admin -> hiện thêm chức năng
                if (role?.toLowerCase() == 'admin') ...[
                  const Divider(),
                  const Text("Admin", style: TextStyle(fontWeight: FontWeight.bold),),
                  ListTile(
                    leading: const Icon(Icons.shopping_bag_outlined, color: Colors.blue),
                    title: const Text('Quản lý Package'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AdminPackagePage()),
                      );
                    },
                  ),

                  ListTile(
                    leading: const Icon(Icons.category, color: Colors.blue),
                    title: const Text('Quản lý Category'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AdminCategoryPage()),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.check, color: Colors.blue),
                    title: const Text('Duyệt tin'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AdminAdModerationPage()),
                      );
                    },
                  ),
                ],
                const Divider(),
                const Text("VIP", style: TextStyle(fontWeight: FontWeight.bold)),
                ListTile(
                  leading: const Icon(Icons.account_balance_wallet),
                  title: const Text('Mua gói VIP'),
                  onTap: () {
                    if (user_id != null && user_id! > 0) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => BuyVIPPage(userId: user_id!),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'),
                          backgroundColor: Colors.redAccent,
                        ),
                      );
                    }
                  },
                ),
                const Divider(),
                const Text("Cài đặt", style: TextStyle(fontWeight: FontWeight.bold)),
                ListTile(
                  leading: const Icon(Icons.settings),
                  title: const Text('Cài đặt tài khoản'),
                  onTap: () {
                    if (user_id != null && user_id! > 0) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AccountSettingsPage(userId: user_id!),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'),
                          backgroundColor: Colors.redAccent,
                        ),
                      );
                    }
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: const Text(
                    'Đăng xuất',
                    style: TextStyle(color: Colors.red),
                  ),
                  onTap: () async {
                    await SessionManager.logout();
                    setState(() {
                      isLoggedIn = false;
                      email = null;
                      role = null;
                      user_id = null;
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // 1. Cập nhật trang Account (vì nó chứa logic đăng nhập/xuất)
    _pages[4] = _accountPage();

    Widget currentPage = _pages[_selectedIndex];

    // 2. 🌟 Xử lý logic hiển thị Tab Chat (index 3) dựa trên isLoggedIn
    if (_selectedIndex == 3 && !isLoggedIn) {
      currentPage = const Center(child: Text('Vui lòng đăng nhập để chat'));
    } else if (_selectedIndex == 3 && isLoggedIn) {
      currentPage = const ConversationListPage();
    } else {
      // Giữ nguyên các trang khác
      currentPage = _pages[_selectedIndex];
    }

    return Scaffold(
      appBar: _selectedIndex == 4
          ? null
          : AppBar(
        backgroundColor: Colors.yellow,
        leading: IconButton(
          color: Colors.black,
          onPressed: () {},
          icon: const Icon(Icons.menu),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border),
            color: Colors.black,
            onPressed: () {
              if (user_id != null && user_id! > 0) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => FavoritePage(userId: user_id!),
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Vui lòng đăng nhập để xem yêu thích")),
                );
              }
            },
          ),

          IconButton(
            icon: const Icon(Icons.notifications_none),
            color: Colors.black,
            onPressed: () {
              print("Nhấn nút thông báo!");
            },
          ),
        ],
      ),
      body: currentPage,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: Colors.white,
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: "Trang chủ",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.card_travel_outlined),
            label: "Quản lý tin",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle_outline, size: 40, color: Colors.black),
            label: "Đăng tin",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_outlined),
            label: "Chat",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: "Tài khoản",
          ),
        ],
      ),
    );
  }
}