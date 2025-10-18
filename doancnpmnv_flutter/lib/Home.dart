import 'package:doancnpmnv_flutter/ManageAdsPage.dart';
import 'package:doancnpmnv_flutter/PostAdPage.dart';
import 'package:doancnpmnv_flutter/admin/AdminAdModerationPage.dart';
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

  final List<Widget> _pages = [];

  @override
  void initState() {
    super.initState();
    checkLogin();
    _pages.addAll([
      const Center(child: Text('Trang chủ')),
      const ManageAdsPage(),
      const PostAdPage(),
      const Center(child: Text('Chat')),
      _accountPage(),
    ]);
  }

  Future<void> checkLogin() async {
    final token = await SessionManager.getToken();
    final userEmail = await SessionManager.getUserEmail();
    final userRole = await SessionManager.getUserRole(); // 🔹 lấy role

    setState(() {
      isLoggedIn = token != null;
      email = userEmail;
      role = userRole;
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
                  const Divider(),
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
                ListTile(
                  leading: const Icon(Icons.settings),
                  title: const Text('Cài đặt tài khoản'),
                  onTap: () {},
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
    _pages[4] = _accountPage();

    return Scaffold(
      appBar: _selectedIndex == 4
          ? null
          : AppBar(
        backgroundColor: Colors.yellow[300],
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
              print("Nhấn nút yêu thích!");
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
      body: _pages[_selectedIndex],
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
