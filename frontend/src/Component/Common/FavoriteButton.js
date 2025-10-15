import React, { useState } from "react";
import axios from "axios";

function FavoriteButton({ productId, userId }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = async () => {
    try {
      await axios.post("http://localhost:5234/api/Favorite/add", {
        UserID: userId,
        AdvertisementID: productId,
      });

      setIsFavorited(true);
      alert("Đã lưu tin thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu yêu thích:", error);
      alert("Không thể lưu tin. Vui lòng thử lại!");
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
