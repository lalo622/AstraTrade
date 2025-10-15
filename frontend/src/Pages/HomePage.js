import React, { useState } from 'react';
import '../Pages/HomePage.css';

function HomePage() {
  const [location, setLocation] = useState('Hồ Chí Minh');

  const categories = [
    { icon: '🚗', name: 'Xe cộ', count: '50,234' },
    { icon: '🏠', name: 'Bất động sản', count: '120,456' },
    { icon: '📱', name: 'Điện thoại', count: '34,567' },
    { icon: '💻', name: 'Đồ điện tử', count: '45,678' },
    { icon: '👕', name: 'Thời trang', count: '23,456' },
    { icon: '💼', name: 'Việc làm', count: '12,345' },
    { icon: '🛋️', name: 'Đồ gia dụng', count: '18,234' },
    { icon: '📚', name: 'Giáo dục', count: '8,901' },
  ];

  const products = [
    { id: 1, title: 'iPhone 15 Pro Max 256GB', price: '28,900,000', location: 'Quận 1, TP.HCM', time: '2 giờ trước', image: 'https://placehold.co/300x200/FFB800/333?text=iPhone+15' },
    { id: 2, title: 'Honda Vision 2024 mới 99%', price: '32,500,000', location: 'Quận 3, TP.HCM', time: '5 giờ trước', image: 'https://placehold.co/300x200/FFA500/333?text=Honda+Vision' },
    { id: 3, title: 'Cho thuê căn hộ 2PN', price: '12,000,000', location: 'Quận 7, TP.HCM', time: '1 ngày trước', image: 'https://placehold.co/300x200/FFD700/333?text=Căn+hộ' },
    { id: 4, title: 'MacBook Air M2 2023', price: '24,500,000', location: 'Quận 10, TP.HCM', time: '3 giờ trước', image: 'https://placehold.co/300x200/FFDB58/333?text=MacBook' },
    { id: 5, title: 'Samsung Galaxy S24 Ultra', price: '26,900,000', location: 'Bình Thạnh, TP.HCM', time: '4 giờ trước', image: 'https://placehold.co/300x200/FFB800/333?text=Samsung' },
    { id: 6, title: 'Yamaha Exciter 155 VVA', price: '48,500,000', location: 'Tân Bình, TP.HCM', time: '6 giờ trước', image: 'https://placehold.co/300x200/FFA500/333?text=Exciter' },
    { id: 7, title: 'Áo khoác nam thu đông', price: '450,000', location: 'Quận 1, TP.HCM', time: '1 ngày trước', image: 'https://placehold.co/300x200/FFD700/333?text=Áo+khoác' },
    { id: 8, title: 'Tủ lạnh Inverter 350L', price: '8,900,000', location: 'Gò Vấp, TP.HCM', time: '2 ngày trước', image: 'https://placehold.co/300x200/FFDB58/333?text=Tủ+lạnh' },
  ];

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header-new">
        <div className="header-container">
          <div className="header-left">
            <div className="logo-new">AstraTrade</div>
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
            <button className="action-btn">❤️</button>
            <button className="action-btn">👤 Tài khoản</button>
            <button className="post-btn">📷 Đăng tin</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Banner */}
        <div className="banner-new">
          <div className="banner-text">Mua bán dễ dàng - An toàn tin cậy</div>
        </div>

        {/* Categories */}
        <section className="categories-section">
          <div className="section-header">
            <h2 className="section-title">Danh mục nổi bật</h2>
            <a href="#" className="view-all">Xem tất cả →</a>
          </div>
          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-card">
                <div className="category-icon">{cat.icon}</div>
                <div className="category-name">{cat.name}</div>
                <div className="category-count">{cat.count} tin</div>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="products-section">
          <div className="section-header">
            <h2 className="section-title">Tin đăng mới nhất</h2>
            <div className="filter-buttons">
              <button className="filter-btn active">Tất cả</button>
              <button className="filter-btn">Cá nhân</button>
              <button className="filter-btn">Bán chuyên</button>
            </div>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card-new">
                <div className="product-image-wrapper">
                  <img src={product.image} alt={product.title} className="product-image" />
                  <button className="favorite-btn">❤️</button>
                </div>
                <div className="product-details">
                  <h3 className="product-title">{product.title}</h3>
                  <div className="product-price">{product.price} ₫</div>
                  <div className="product-location">📍 {product.location}</div>
                  <div className="product-time">{product.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="load-more-wrapper">
            <button className="load-more-btn">Xem thêm tin đăng</button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer-new">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-column">
              <h3 className="footer-title">AstraTrade</h3>
              <p className="footer-description">
                Nền tảng mua bán trực tuyến hàng đầu Việt Nam
              </p>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Hỗ trợ khách hàng</h4>
              <ul className="footer-links">
                <li><a href="#">Trung tâm trợ giúp</a></li>
                <li><a href="#">An toàn mua bán</a></li>
                <li><a href="#">Quy định sử dụng</a></li>
                <li><a href="#">Quy chế hoạt động</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Về AstraTrade</h4>
              <ul className="footer-links">
                <li><a href="#">Giới thiệu</a></li>
                <li><a href="#">Tuyển dụng</a></li>
                <li><a href="#">Truyền thông</a></li>
                <li><a href="#">Liên hệ</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Liên kết</h4>
              <ul className="footer-links">
                <li><a href="#">Facebook</a></li>
                <li><a href="#">YouTube</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Zalo</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 AstraTrade. All rights reserved. Mua bán dễ dàng, an toàn & tin cậy!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;