import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import FavoriteButton from "../Component/Common/FavoriteButton";
import "../Pages/HomePage.css";

function HomePage() {
  const [location, setLocation] = useState("Hồ Chí Minh");
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await axios.get("http://localhost:5234/api/advertisement/all");
        setAds(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách tin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  const handlePostAd = () => {
    if (user) navigate("/postad");
    else navigate("/login");
  };

  return (
    <div className="homepage">
      
      {/* Nội dung chính */}
      <main className="main-content">
        {/* Banner */}
        <div className="banner-new">
          <div className="banner-text">Mua bán dễ dàng - An toàn tin cậy</div>
        </div>

        {/* Tin đăng mới nhất */}
        <section className="products-section">
          <div className="section-header">
            <h2 className="section-title">Tin đăng mới nhất</h2>
          </div>

          {loading ? (
            <p>Đang tải danh sách tin...</p>
          ) : ads.length === 0 ? (
            <p>Hiện chưa có tin đăng nào.</p>
          ) : (
           <div className="products-grid">
  {ads.map((ad) => (
    <div
      key={ad.advertisementID}
      className="product-card-new cursor-pointer"
      onClick={() => navigate(`/post/${ad.advertisementID}`)}
    >
      <div className="product-image-wrapper">
        <img
          src={ad.image || "https://placehold.co/300x200?text=No+Image"}
          alt={ad.title}
          className="product-image"
        />
        <FavoriteButton
          productId={ad.advertisementID}
          userId={user?.id || 0}
        />
      </div>
      <div className="product-details">
        <h3 className="product-title">{ad.title}</h3>
        <div className="product-price">
          {ad.price?.toLocaleString()} ₫
        </div>
        <div className="product-location">
          📦 {ad.categoryName || "Chưa phân loại"}
        </div>
      </div>
    </div>
  ))}
</div>

          )}
        </section>
      </main>

    </div>
  );
}

export default HomePage;
