import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../Pages/AdminPage.css"; 

const AdminLayout = ({ children, adminUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định active menu dựa trên current path
  const getActiveMenu = () => {
    if (location.pathname.includes("/admin/vip-packages")) return "vip-packages";
    if (location.pathname.includes("/admin/categories")) return "categories";
    if (location.pathname.includes("/admin/moderation")) return "moderation";
    if (location.pathname.includes("/admin/reports")) return "reports"; 
    return "dashboard";
  };

  const activeMenu = getActiveMenu();

  const handleMenuClick = (menu) => {
    switch (menu) {
      case "dashboard":
        navigate("/admin");
        break;
      case "moderation":
        navigate("/admin/moderation");
        break;
      case "categories":
        navigate("/admin/categories");
        break;
      case "vip-packages":
        navigate("/admin/vip-packages");
        break;
      case "reports": 
        navigate("/admin/reports");
        break;
      default:
        navigate("/admin");
    }
  };

  const getPageTitle = () => {
    switch (activeMenu) {
      case "dashboard":
        return "Trang chủ Admin";
      case "moderation":
        return "Quản lý Bài Đăng";
      case "categories":
        return "Quản lý Danh mục";
      case "vip-packages":
        return "Quản lý Gói VIP";
      case "reports": 
        return "Quản lý Báo cáo";
      default:
        return "Trang chủ Admin";
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Astra Trade Admin</h2> 
        </div>
        
        <ul className="sidebar-menu">
          <li 
            className={activeMenu === 'dashboard' ? 'active' : ''}
            onClick={() => handleMenuClick('dashboard')}
          >
             Trang chủ
          </li>
          <li 
            className={activeMenu === 'moderation' ? 'active' : ''}
            onClick={() => handleMenuClick('moderation')}
          >
             Quản lý bài đăng
          </li>
          <li 
            className={activeMenu === 'categories' ? 'active' : ''}
            onClick={() => handleMenuClick('categories')}
          >
             Quản lý danh mục
          </li>
          <li 
            className={activeMenu === 'vip-packages' ? 'active' : ''}
            onClick={() => handleMenuClick('vip-packages')}
          >
             Quản lý gói VIP
          </li>
          <li 
            className={activeMenu === 'reports' ? 'active' : ''}
            onClick={() => handleMenuClick('reports')}  
          >
             Quản lý báo cáo
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <div className="content-header">
          <h1>{getPageTitle()}</h1>
        </div>
        <div className="content-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;