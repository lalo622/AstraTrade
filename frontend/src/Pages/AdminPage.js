import React, { useState } from "react";
import AdminCategoryList from "../Component/Admin/Category/AdminCategoryList";
import "./AdminPage.css";

const AdminPage = () => {
  const [activeMenu, setActiveMenu] = useState("categories");

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardContent />;
      case "categories":
        return <AdminCategoryList />;
      case "posts":
        return <PostsContent />;
      default:
        return <AdminCategoryList />;
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <ul className="sidebar-menu">
          <li 
            className={activeMenu === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveMenu('dashboard')}
          >
            <span>🏠</span> Trang chủ
          </li>
          <li 
            className={activeMenu === 'categories' ? 'active' : ''}
            onClick={() => setActiveMenu('categories')}
          >
            <span>📁</span> Quản lý danh mục
          </li>
          <li 
            className={activeMenu === 'posts' ? 'active' : ''}
            onClick={() => setActiveMenu('posts')}
          >
            <span>📝</span> Quản lý bài đăng
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <div className="content-header">
          <h1>
            {activeMenu === 'dashboard' && 'Trang chủ Admin'}
            {activeMenu === 'categories' && 'Quản lý Danh mục'}
            {activeMenu === 'posts' && 'Quản lý Bài đăng'}
          </h1>
        </div>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Component tạm thời cho các trang
const DashboardContent = () => (
  <div className="dashboard-content">
    <h2>Chào mừng đến trang quản trị</h2>
    
  </div>
);

const PostsContent = () => (
  <div className="posts-content">
    <h2>Quản lý Bài đăng</h2>
   
  </div>
);

export default AdminPage;