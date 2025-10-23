import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext"; 

function FavoriteButton({ productId }) {
  const { user } = useAuth(); 
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const checkFavorite = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/favorite/user/${userId}`);
        const isFav = res.data.some(f => f.advertisementID === productId);
        setIsFavorited(isFav);
      } catch (err) {
        console.error("Lỗi khi kiểm tra yêu thích:", err);
      }
    };
    checkFavorite();
  }, [user, productId]);

  const handleFavorite = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập trước khi lưu tin!");
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("Lỗi: Không tìm thấy user ID!");
      return;
    }

    try {
      if (isFavorited) {
        await axios.delete(`http://localhost:5234/api/favorite/remove`, {
          params: { userId: parseInt(userId), adId: productId },
        });
        setIsFavorited(false);
      } else {
        await axios.post(`http://localhost:5234/api/favorite/add`, {
          UserID: parseInt(userId),
          AdvertisementID: productId,
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Lỗi khi lưu yêu thích:", error);
    }
  };

  return (
    <button
      className={`favorite-btn ${isFavorited ? "active" : ""}`}
      onClick={handleFavorite}
    >
      {isFavorited ? "💖" : "🤍"}
    </button>
  );
}

export default FavoriteButton;