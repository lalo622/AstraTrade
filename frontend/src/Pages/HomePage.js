import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import FavoriteButton from "../Component/Common/FavoriteButton";
import { Search } from "lucide-react";

function HomePage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lấy danh sách categories
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
   useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const categoryFromUrl = urlParams.get('category');
    
    console.log("Search params from URL:", { searchQuery, categoryFromUrl });
    
    // Load ads với filter từ URL
    fetchAds(1, categoryFromUrl || null, searchQuery || '');
  }, [window.location.search]);

  // Lấy ads với filter
  const fetchAds = async (page = 1, categoryId = null, searchQuery = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize: 10,
        vipOnly: page === 1 && !categoryId && !searchQuery // Chỉ VIP khi không search
      };
      
      if (categoryId) {
        params.categoryId = categoryId;
      }
      
     
      if (searchQuery) {
        params.searchQuery = searchQuery;
      }

      console.log("Calling API with params:", params);
      
      const res = await axios.get("http://localhost:5234/api/advertisement/filter", { params });

      const visibleAds = (res.data.ads || []).filter(ad => !ad.isHidden && ad.status === "Approved");
      setAds(visibleAds);
      setTotalPages(res.data.totalPages);
      setCurrentPage(page);
        } catch (err) {
          console.error("Lỗi khi tải danh sách tin:", err);
        } finally {
          setLoading(false);
        }
      };

  // Load ads ban đầu (chỉ VIP)
  useEffect(() => {
    fetchAds(1);
  }, []);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    fetchAds(1, categoryId || null);
  };

  const handleSearch = () => {
    fetchAds(1, selectedCategory || null);
  };

  const handlePageChange = (page) => {
    fetchAds(page, selectedCategory || null);
  };

  const handlePostAd = () => {
    if (user) navigate("/postad");
    else navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-16 mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Mua bán dễ dàng - An toàn tin cậy
          </h1>
        </div>
        {/* Tin đăng Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory 
                ? `Tin đăng ${categories.find(c => c.categoryID == selectedCategory)?.name || ''}` 
                : 'Tin đăng nổi bật'
              }
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Không tìm thấy tin đăng nào.</p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {ads.map((ad) => (
                  <div
                    key={ad.advertisementID}
                    onClick={() => navigate(`/post/${ad.advertisementID}`)}
                    className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                      ad.isUserVip ? 'ring-2 ring-yellow-400 shadow-yellow-100' : ''
                    }`}
                  >
                    {/* Image Container */}
                    <div className="relative overflow-hidden">
                      <img
                        src={ad.image || "https://placehold.co/300x200?text=No+Image"}
                        alt={ad.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* VIP Badge */}
                      {ad.isUserVip && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          VIP ⭐
                        </div>
                      )}
                      
                      {/* Favorite Button */}
                      <div 
                        className="absolute top-2 right-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoriteButton productId={ad.advertisementID} />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px] mb-2">
                        {ad.title}
                      </h3>
                      
                      <div className="text-lg font-bold text-yellow-600 mb-2">
                        {ad.price?.toLocaleString()} ₫
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <span className="mr-1">📦</span>
                        <span>{ad.categoryName || "Chưa phân loại"}</span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-600">
                        <span className="mr-1">👤</span>
                        <span>
                          {ad.userName}
                          {ad.isUserVip && <span className="text-yellow-500 ml-1">★</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default HomePage;