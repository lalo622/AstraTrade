import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import { Search, ChevronDown, MessageCircle, Bot, MapPin } from 'lucide-react'; 
import axios from 'axios';
import "../../Pages/HomePage.css";

const MainLayout = ({ children, onSearch }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Search states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Lấy categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5234/api/advertisement/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = () => {
    // Tạo search parameters và navigate đến homepage với query string
    const searchParams = new URLSearchParams();
    
    if (searchQuery) {
      searchParams.append('q', searchQuery);
    }
    
    if (selectedCategory) {
      searchParams.append('category', selectedCategory);
    }

    // Navigate về homepage với search parameters
    navigate(`/?${searchParams.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCategoryName = () => {
    if (!selectedCategory) return 'Danh mục';
    const category = categories.find(c => c.categoryID === selectedCategory);
    return category ? category.name : 'Danh mục';
  };

  const handleChatbotClick = () => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập để sử dụng chatbot!');
      navigate('/login');
      return;
    }

    // Kiểm tra cả isVip và IsVIP (do backend có thể trả về khác nhau)
    const isVipUser = user.isVip || user.IsVIP;
    
    if (!isVipUser) {
      toast.info('Tính năng này dành cho thành viên VIP. Vui lòng nâng cấp tài khoản!', {
        autoClose: 4000,
        onClick: () => navigate('/packages')
      });
      return;
    }

    navigate('/chatbot');
  };

  const handleNearbyClick = () => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập để xem bài đăng gần bạn!');
      navigate('/login');
      return;
    }
    navigate('/nearby');
  };

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header-new">
        <div className="header-container">
          <div className="header-left">
            <div className="logo-new" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              AstraTrade
            </div>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            <button className="action-btn">🔔</button>
            <button className="action-btn" onClick={() => navigate("/favorites")}>
              ❤️
            </button>
            
            {/* Nút Bài đăng gần đây */}
            <button 
              className="action-btn nearby-btn" 
              onClick={handleNearbyClick}
              title="Bài đăng gần bạn"
            >
              <MapPin className="w-5 h-5" />
            </button>
            
            {user && (
              <button 
                className="action-btn chat-btn" 
                onClick={() => navigate("/chat")}
                title="Tin nhắn"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
                    {user && user.role === 'Admin' && (
            <button 
              className="action-btn admin-btn" 
              onClick={() => navigate("/admin")}
              title="Quản trị hệ thống"
              style={{
                color: 'black',
                fontWeight: 'bold'
              }}
            >
               Quản trị
            </button>
          )}
            {user ? (
              <>
                <span className="action-btn" onClick={() => navigate("/profile")}>
                  👤 Hello, {user.username || user.email || 'User'}
                  {(user.isVip || user.IsVIP) && <span className="ml-1 text-yellow-500">★</span>}
                </span>
                <button className="action-btn" onClick={() => navigate("/my-ads")}>
                  📋 Quản lý tin
                </button>
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

      {/* Search Header Bar - Integrated */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl p-2">
            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-6 py-3 hover:bg-gray-50 rounded-xl transition-colors min-w-[140px] border-r border-gray-200"
              >
                <span className="font-medium text-gray-800">{getCategoryName()}</span>
                <ChevronDown className="w-5 h-5 text-gray-600" />
              </button>
              
              {showCategoryDropdown && (
                <>
                  {/* Overlay để đóng dropdown khi click bên ngoài */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-80 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors text-gray-700 border-b border-gray-100 font-medium"
                    >
                      Tất cả danh mục
                    </button>
                    
                    {categories.map((category) => (
                      <button
                        key={category.categoryID}
                        onClick={() => {
                          setSelectedCategory(category.categoryID);
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors text-gray-700 border-b border-gray-100 last:border-b-0"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search Input */}
            <div className="flex-1 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="flex-1 py-3 outline-none text-gray-800 placeholder-gray-400 text-base"
                onKeyPress={handleKeyPress}
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Nội dung chính */}
      <main className="main-content">{children}</main>

      {/* Floating Chatbot Button */}
      <button
        onClick={handleChatbotClick}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-110 z-50 group"
        title={(user?.isVip || user?.IsVIP) ? "Trợ lý ảo" : "Tính năng VIP - Click để nâng cấp"}
      >
        <Bot className="w-7 h-7" />
        
        {/* Badge VIP */}
        {!(user?.isVip || user?.IsVIP) && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
            VIP
          </span>
        )}
        
        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {(user?.isVip || user?.IsVIP) ? "Trợ lý ảo" : "Nâng cấp VIP để sử dụng"}
        </span>
      </button>

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