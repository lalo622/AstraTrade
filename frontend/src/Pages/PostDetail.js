import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, Calendar, Tag, User, MapPin, Flag, Home } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import FeedbackSection from "../Component/Common/FeedbackSection";
import ReportModal from "./ReportModal";

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5234/api/advertisement/${id}`);
        
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu bài đăng");
        }
        
        const data = await response.json();
        
        // Lấy category
        if (data.categoryID) {
          try {
            const categoryRes = await fetch(`http://localhost:5234/api/Admin/Category/${data.categoryID}`);
            if (categoryRes.ok) {
              const categoryData = await categoryRes.json();
              data.categoryName = categoryData.name;
            } else {
              data.categoryName = "Chưa phân loại";
            }
          } catch (err) {
            data.categoryName = "Chưa phân loại";
          }
        }

        setPost(data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết bài đăng:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài đăng</h2>
          <p className="text-gray-600">{error || "Bài đăng không tồn tại hoặc đã bị xóa"}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getAdTypeBadge = (type) => {
    const badges = {
      Buy: { text: "Cần mua", color: "bg-green-100 text-green-800" },
      Sell: { text: "Cần bán", color: "bg-blue-100 text-blue-800" },
      Rent: { text: "Cho thuê", color: "bg-purple-100 text-purple-800" },
      Service: { text: "Dịch vụ", color: "bg-orange-100 text-orange-800" }
    };
    return badges[type] || { text: type, color: "bg-gray-100 text-gray-800" };
  };

  const adTypeBadge = getAdTypeBadge(post.adType);
  
  const handleChatWithSeller = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để chat!');
      navigate('/login');
      return;
    }

    const sellerId = post.userID;
    
    if (sellerId === user.id) {
      alert('Bạn không thể chat với chính mình!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5234/api/chat/user/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const sellerInfo = await response.json();
        navigate('/chat', {
          state: {
            chatWithUser: {
              userId: sellerInfo.userID,
              username: sellerInfo.username
            }
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Không thể kết nối đến người bán!');
    }
  };

  const handleOpenReportModal = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để báo cáo!');
      navigate('/login');
      return;
    }

    if (post.userID === user.id) {
      alert('Bạn không thể báo cáo tin đăng của chính mình!');
      return;
    }

    setIsReportModalOpen(true);
  };

  // Format địa chỉ từ LocationAddress hoặc ward
  const getFullAddress = () => {
    // Debug log để kiểm tra
    console.log('Address Debug:', {
      locationAddress: post.locationAddress,
      address: post.address,
      ward: post.ward
    });
    
    // Ưu tiên LocationAddress
    if (post.locationAddress) {
      return post.locationAddress;
    }
    
    // Fallback: tự tạo từ address + ward
    const parts = [];
    if (post.address) parts.push(post.address);
    if (post.ward) parts.push(post.ward);
    
    return parts.length > 0 ? `${parts.join(', ')}, TP. Hồ Chí Minh` : null;
  };

  const fullAddress = getFullAddress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><a href="/" className="hover:text-blue-600 transition">Trang chủ</a></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Chi tiết tin</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img
                  src={post.image || "https://via.placeholder.com/800x500?text=No+Image"}
                  alt={post.title}
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${adTypeBadge.color}`}>
                    {adTypeBadge.text}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.postDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4" />
                    <span>{post.categoryName || "Chưa phân loại"}</span>
                  </div>
                </div>

                {/* PHẦN ĐỊA CHỈ MỚI */}
                {fullAddress && (
                  <div className="mb-6 pb-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      Địa chỉ
                    </h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="flex items-start gap-2 text-gray-800">
                        <Home className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{fullAddress}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Mô tả chi tiết
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {post.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
                  </p>
                </div>
              </div>
            </div>

            <FeedbackSection advertisementId={id} currentUser={user} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">Giá bán</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {post.price ? post.price.toLocaleString("vi-VN") + " ₫" : "Liên hệ"}
                  </p>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mb-3">
                  Liên hệ người bán
                </button>
                
                <button 
                  onClick={handleChatWithSeller}
                  className="w-full border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 mb-3"
                >
                  Gửi tin nhắn
                </button>
                
                <button 
                  onClick={handleOpenReportModal}
                  className="w-full border-2 border-red-500 text-red-600 font-semibold py-3 rounded-lg hover:bg-red-50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <Flag className="w-5 h-5" />
                  <span>Báo cáo tin đăng</span>
                </button>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center">
                  <span className="text-xl mr-2">⚠️</span>
                  Lưu ý an toàn
                </h3>
                <ul className="text-xs text-yellow-800 space-y-2.5">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Kiểm tra kỹ sản phẩm trước khi thanh toán</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Không giao dịch trước khi xem hàng</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Gặp mặt tại nơi công cộng</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Báo cáo nếu phát hiện gian lận</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        advertisementId={parseInt(id)}
        userId={user?.id}
        token={user?.token}
      />
    </div>
  );
};

export default PostDetail;