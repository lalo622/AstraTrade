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
        const res = await axios.get(`http://localhost:5234/api/favorite/user/${userId}`);
        const isFav = res.data.some(f => f.advertisementID === productId);
        setIsFavorited(isFav);
      } catch (err) {
        console.error("Lỗi khi kiểm tra yêu thích:", err);
      }
    };
    checkFavorite();
  }, [user, productId]);

  const handleFavorite = async (e) => {
    e.stopPropagation(); // QUAN TRỌNG: Ngăn chặn sự kiện lan truyền

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
      onClick={handleFavorite}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center
        bg-white shadow-lg transition-all duration-300
        hover:scale-110 active:scale-95
        ${isFavorited 
          ? 'text-red-500 hover:bg-red-50' 
          : 'text-gray-400 hover:bg-gray-50'
        }
      `}
    >
      <span className="text-xl">
        {isFavorited ? "💖" : "🤍"}
      </span>
    </button>
  );
}

export default FavoriteButton;