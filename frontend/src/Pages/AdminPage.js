import React, { useState, useEffect } from "react";
import AdminCategoryList from "../Component/Admin/Category/AdminCategoryList";
import AdminModerationPage from "../Component/Admin/AdModeration/AdminModerationPage";
import "./AdminPage.css";

const AdminPage = () => {
  const [activeMenu, setActiveMenu] = useState("moderation");
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user từ localStorage (nếu có)
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      console.log("User từ localStorage:", user); // Debug
      
      // Đặt user bất kể role nào
      setAdminUser(user || { username: "Khách" });
      
    } catch (error) {
      console.error("Lỗi parse user:", error);
      setAdminUser({ username: "Khách" });
    }
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardContent />;
      case "moderation":
        return <AdminModerationPage />;
      case "categories":
        return <AdminCategoryList />;
      default:
        return <AdminModerationPage />;
    }
  };

  // Nếu chưa load xong, hiển thị loading
  if (!adminUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>⚙️ Admin Panel</h2>
          <p className="text-sm text-gray-400">Xin chào {adminUser.username || "Khách"}</p>
        </div>
        <ul className="sidebar-menu">
          <li 
            className={activeMenu === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveMenu('dashboard')}
          >
            <span>🏠</span> Trang chủ
          </li>
          <li 
            className={activeMenu === 'moderation' ? 'active' : ''}
            onClick={() => setActiveMenu('moderation')}
          >
            <span>⚖️</span> Duyệt bài đăng
          </li>
          <li 
            className={activeMenu === 'categories' ? 'active' : ''}
            onClick={() => setActiveMenu('categories')}
          >
            <span>📁</span> Quản lý danh mục
          </li>
        </ul>
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <div className="content-header">
          <h1>
            {activeMenu === 'dashboard' && 'Trang chủ Admin'}
            {activeMenu === 'moderation' && 'Duyệt Bài Đăng'}
            {activeMenu === 'categories' && 'Quản lý Danh mục'}
          </h1>
        </div>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Component tạm thời cho Dashboard
const DashboardContent = () => (
  <div className="dashboard-content">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">📊 Tổng quản lý</h3>
        <p className="text-3xl font-bold text-blue-600">0</p>
        <p className="text-sm text-gray-600">Bài đăng tất cả</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">👥 Người dùng</h3>
        <p className="text-3xl font-bold text-green-600">0</p>
        <p className="text-sm text-gray-600">Tài khoản hoạt động</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">⏳ Chờ duyệt</h3>
        <p className="text-3xl font-bold text-yellow-600">0</p>
        <p className="text-sm text-gray-600">Bài chờ xử lý</p>
      </div>
    </div>
  </div>
);

export default AdminPage;