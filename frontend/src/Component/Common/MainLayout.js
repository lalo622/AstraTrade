import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../Pages/HomePage.css";

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = "Hồ Chí Minh";

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header-new">
        <div className="header-container">
          <div className="header-left">
            <div className="logo-new" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              AstraTrade
            </div>
            <div className="location-picker">
              <span className="location-icon">📍</span>
              <span className="location-text">{location}</span>
              <span className="dropdown-icon">▼</span>
            </div>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-input-new"
              placeholder="Tìm kiếm sản phẩm, dịch vụ..."
            />
            <button className="search-button-new">🔍</button>
          </div>

          <div className="header-actions">
            <button className="action-btn">🔔</button>
            <button className="action-btn" onClick={() => navigate("/favorites")}>
              ❤️
            </button>
            {user ? (
              <>
                <span className="action-btn">👤 Hello, {user.username}</span>
                <button className="action-btn" onClick={logout}>🚪 Đăng xuất</button>
              </>
            ) : (
              <button className="action-btn" onClick={() => navigate("/login")}>
                👤 Tài khoản
              </button>
            )}
            <button className="post-btn" onClick={() => navigate("/postad")}>
              📷 Đăng tin
            </button>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="main-content">{children}</main>

      {/* Footer */}
      <footer className="footer-new">
        <div className="footer-container">
          <p>© 2025 AstraTrade. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default MainLayout;
