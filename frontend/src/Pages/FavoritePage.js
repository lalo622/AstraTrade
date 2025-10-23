import React, { useEffect, useState } from "react";
import axios from "axios";
import AdCard from "../Component/Common/AdCard";
import { useAuth } from "../Context/AuthContext";

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5234/api/favorite/user/${userId}`
        );
        setFavorites(res.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách yêu thích:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const removeFavorite = async (adId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      await axios.delete(`http://localhost:5234/api/favorite/remove`, {
        params: { userId: parseInt(userId), adId },
      });
      setFavorites(favorites.filter((f) => f.advertisementID !== adId));
      alert("Đã xóa khỏi yêu thích");
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
    }
  };

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;

  if (!user) return <p className="text-center mt-10">Vui lòng đăng nhập để xem danh sách yêu thích.</p>;

  return (
    <div className="container mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-4">💖 Tin đã yêu thích</h1>
      {favorites.length === 0 ? (
        <p>Chưa có tin nào trong danh sách yêu thích.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((ad) => (
            <AdCard key={ad.favoriteID} ad={ad} onRemove={removeFavorite} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritePage;