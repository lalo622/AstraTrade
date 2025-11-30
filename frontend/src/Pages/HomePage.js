import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import FavoriteButton from "../Component/Common/FavoriteButton";
import { Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";

// Component Banner Quảng cáo
const AdBanner = ({ position = 'sidebar' }) => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [closedAds, setClosedAds] = useState([]);

  useEffect(() => {
    fetchActiveAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ads]);

  const fetchActiveAds = async () => {
    try {
      const response = await axios.get('http://localhost:5234/api/admin/ads');
      const activeAds = response.data.filter(ad => ad.isActive);
      setAds(activeAds);
    } catch (error) {
      console.error('Lỗi khi tải quảng cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (targetUrl) => {
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCloseAd = (adId) => {
    setClosedAds([...closedAds, adId]);
  };

  if (loading) {
    return (
      <div className={`${position === 'sidebar' ? 'w-full' : 'w-full max-w-4xl mx-auto'} bg-gray-100 rounded-2xl animate-pulse`}>
        <div className={`${position === 'sidebar' ? 'h-96' : 'h-32'} bg-gray-200`}></div>
      </div>
    );
  }

  const visibleAds = ads.filter(ad => !closedAds.includes(ad.adID));
  if (visibleAds.length === 0) return null;

  const currentAd = visibleAds[currentAdIndex % visibleAds.length];

  // Sidebar style
  if (position === 'sidebar') {
    return (
      <div className="space-y-4 sticky top-24">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Quảng cáo
        </h3>
        
        <div
          className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer"
          onClick={() => handleAdClick(currentAd.targetUrl)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseAd(currentAd.adID);
            }}
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            <img
              src={`http://localhost:5234${currentAd.imageUrl}`}
              alt={currentAd.name}
              className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = 'https://placehold.co/300x400?text=Ad+Banner';
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm font-semibold">{currentAd.name}</p>
              <p className="text-xs opacity-90 mt-1">Nhấn để xem chi tiết →</p>
            </div>

            <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Quảng cáo
            </div>
          </div>
        </div>

        {visibleAds.length > 1 && (
          <div className="flex gap-2 justify-center">
            {visibleAds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentAdIndex
                    ? 'w-8 bg-orange-500'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Banner ngang
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer mb-8">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCloseAd(currentAd.adID);
        }}
        className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={() => handleAdClick(currentAd.targetUrl)}
        className="relative h-32 sm:h-40"
      >
        <img
          src={`http://localhost:5234${currentAd.imageUrl}`}
          alt={currentAd.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/1200x200?text=Ad+Banner';
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <p className="text-lg font-bold drop-shadow-lg">{currentAd.name}</p>
            <p className="text-sm opacity-90 mt-1">Nhấn để xem chi tiết →</p>
          </div>
        </div>
      </div>

      {visibleAds.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
          {visibleAds.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentAdIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentAdIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        Quảng cáo
      </div>
    </div>
  );
};

function HomePage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

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
    fetchAds(1, categoryFromUrl || null, searchQuery || '');
  }, [window.location.search]);

  const fetchAds = async (page = 1, categoryId = null, searchQuery = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize: 12,
        vipOnly: page === 1 && !categoryId && !searchQuery
      };
      
      if (categoryId) params.categoryId = categoryId;
      if (searchQuery) params.searchQuery = searchQuery;
      
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

  useEffect(() => {
    fetchAds(1);
  }, []);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    fetchAds(1, categoryId || null);
  };

  const handlePageChange = (page) => {
    fetchAds(page, selectedCategory || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostAd = () => {
    if (user) navigate("/postad");
    else navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto px-4">
        {/* Cột trái - Ẩn trên mobile */}
        <div className="hidden lg:block lg:col-span-2"></div>

        {/* Cột giữa - Nội dung chính */}
        <main className="lg:col-span-7 py-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJhIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBIMCB6TTQwIDQwVjBMNDAgNDB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYxYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative px-8 py-16 text-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
                Mua bán dễ dàng - An toàn tin cậy
              </h1>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Kết nối người mua và người bán trên khắp Việt Nam
              </p>
              
              <button
                onClick={handlePostAd}
                className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Đăng tin ngay
              </button>
            </div>
          </div>

          {/* Banner quảng cáo ngang - Hiển thị trên mobile/tablet */}
          <div className="lg:hidden">
            <AdBanner position="horizontal" />
          </div>

          {/* Listings Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {selectedCategory 
                  ? `${categories.find(c => c.categoryID == selectedCategory)?.name || ''}` 
                  : 'Tin đăng nổi bật'
                }
              </h2>
              <div className="text-sm text-gray-500">
                {ads.length} sản phẩm
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col justify-center items-center py-32">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Đang tải...</p>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-2xl">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-xl">Không tìm thấy tin đăng nào</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ads.map((ad) => (
                    <div
                      key={ad.advertisementID}
                      onClick={() => navigate(`/post/${ad.advertisementID}`)}
                      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group ${
                        ad.isUserVip ? 'ring-2 ring-yellow-400' : ''
                      }`}
                    >
                      <div className="relative overflow-hidden aspect-[4/3]">
                        <img
                          src={ad.image || "https://placehold.co/400x300?text=No+Image"}
                          alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {ad.isUserVip && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <span>⭐</span>
                            <span>VIP</span>
                          </div>
                        )}
                        
                        <div 
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoriteButton productId={ad.advertisementID} />
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 min-h-[48px] mb-3 group-hover:text-orange-600 transition-colors">
                          {ad.title}
                        </h3>
                        
                        <div className="text-xl font-bold text-orange-600 mb-3">
                          {ad.price?.toLocaleString()} ₫
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">📦</span>
                            <span className="truncate">{ad.categoryName || "Chưa phân loại"}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">👤</span>
                            <span className="truncate">
                              {ad.userName}
                              {ad.isUserVip && <span className="text-yellow-500 ml-1">★</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-[44px] px-4 py-2 rounded-lg font-semibold transition-all ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-110'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 hover:border-orange-500'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* Cột phải - Banner quảng cáo (chỉ hiển thị trên desktop) */}
        <aside className="hidden lg:block lg:col-span-3 py-6 pr-4">
          <AdBanner position="sidebar" />
        </aside>
      </div>
    </div>
  );
}

export default HomePage;