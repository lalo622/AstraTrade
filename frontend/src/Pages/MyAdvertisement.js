import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Eye, AlertCircle, Clock, CheckCircle, XCircle, EyeOff } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';

const UserAdsManagement = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    deleted: 0,
    hidden: 0,
    visible: 0,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAdId, setDeleteAdId] = useState(null);

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      fetchUserAds();
    }
  }, [activeTab, userId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem tin đăng của mình</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  const fetchUserAds = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' || activeTab === 'visible' || activeTab === 'hidden' ? '' : activeTab;
      
      const response = await fetch(`http://localhost:5234/api/advertisement/user-ads-byid?userId=${userId}&status=${status}`);
      const data = await response.json();
      
      console.log('📦 API Response:', data);
      
      let filteredAds = data.ads || [];
      
      // ✅ Lọc theo tab visible/hidden
      if (activeTab === 'visible') {
        filteredAds = filteredAds.filter(ad => ad.status === 'Approved' && !ad.isHidden);
      } else if (activeTab === 'hidden') {
        filteredAds = filteredAds.filter(ad => ad.isHidden);
      }
      
      setAds(filteredAds);
      
      // ✅ Tính toán counts từ data.ads
      const allAds = data.ads || [];
      setCounts({
        pending: data.counts?.pending || 0,
        approved: data.counts?.approved || 0,
        rejected: data.counts?.rejected || 0,
        deleted: data.counts?.deleted || 0,
        hidden: allAds.filter(ad => ad.isHidden).length, // ✅ Đếm tin bị ẩn
        visible: allAds.filter(ad => ad.status === 'Approved' && !ad.isHidden).length, // ✅ Đếm tin đang hiển thị
        total: data.counts?.total || 0
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách tin:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (adId, currentIsHidden) => {
  try {
    const response = await fetch(`http://localhost:5234/api/advertisement/toggle-visibility/${adId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert('Có lỗi xảy ra: ' + errorText);
      return;
    }

    const contentType = response.headers.get('content-type');
    let result = {};
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
      alert(result.message || 'Thao tác thành công');
    } else {
      alert(currentIsHidden ? 'Đã hiện bài viết' : 'Đã ẩn bài viết');
    }

    
    setAds(prev =>
      prev.map(ad =>
        ad.advertisementID === adId ? { ...ad, isHidden: !currentIsHidden } : ad
      )
    );

   
    setCounts(prev => ({
      ...prev,
      hidden: prev.hidden + (currentIsHidden ? -1 : 1),
      visible: prev.visible + (currentIsHidden ? 1 : -1)
    }));

  } catch (error) {
    console.error('Lỗi khi ẩn/hiện tin:', error);
    alert('Có lỗi xảy ra: ' + error.message);
  }
};


  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5234/api/advertisement/delete-ad/${deleteAdId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setShowDeleteModal(false);
        fetchUserAds();
        alert('Xóa tin thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa tin:', error);
      alert('Có lỗi xảy ra khi xóa tin!');
    }
  };

  const viewDetail = async (adId) => {
    try {
      const response = await fetch(`http://localhost:5234/api/advertisement/${adId}`);
      const data = await response.json();
      setSelectedAd(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết tin:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { 
        icon: <Clock className="w-4 h-4" />, 
        text: 'Chờ duyệt', 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-300' 
      },
      Approved: { 
        icon: <CheckCircle className="w-4 h-4" />, 
        text: 'Đã duyệt', 
        class: 'bg-green-100 text-green-800 border-green-300' 
      },
      Rejected: { 
        icon: <XCircle className="w-4 h-4" />, 
        text: 'Từ chối', 
        class: 'bg-red-100 text-red-800 border-red-300' 
      },
      Deleted: { 
        icon: <Trash2 className="w-4 h-4" />, 
        text: 'Đã xóa', 
        class: 'bg-gray-100 text-gray-800 border-gray-300' 
      }
    };

    const config = statusConfig[status] || statusConfig.Pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.class}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý tin đăng của tôi</h1>
        </div>

        {/* ✅ TABS MỚI: Thêm "Đang hiển thị" và "Đã ẩn" */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { key: 'all', label: 'Tất cả', count: counts.total || 0 },
                { key: 'visible', label: 'Đang hiển thị', count: counts.visible || 0, icon: <Eye className="w-4 h-4" /> },
                { key: 'hidden', label: 'Đã ẩn', count: counts.hidden || 0, icon: <EyeOff className="w-4 h-4" /> },
                { key: 'pending', label: 'Chờ duyệt', count: counts.pending || 0 },
                { key: 'approved', label: 'Đã duyệt', count: counts.approved || 0 },
                { key: 'rejected', label: 'Từ chối', count: counts.rejected || 0 },
                { key: 'deleted', label: 'Đã xóa', count: counts.deleted || 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Không có tin đăng nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ads.map((ad) => (
                <div key={ad.advertisementID} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 relative">
                      <img
                        src={ad.image || 'https://via.placeholder.com/150'} 
                        alt={ad.title}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      {ad.isHidden && (
                        <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Đã ẩn
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">{ad.title}</h3>
                          <p className="text-sm text-gray-500">
                            Danh mục: <span className="font-medium">{ad.categoryName || 'Chưa phân loại'}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(ad.status)}
                          {ad.isHidden && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-300">
                              <EyeOff className="w-4 h-4" />
                              Ẩn khỏi trang chủ
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-blue-600 mb-1">{formatPrice(ad.price)}</p>
                          <p className="text-xs text-gray-500">Ngày đăng: {formatDate(ad.postDate)}</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => viewDetail(ad.advertisementID)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Chi tiết
                          </button>
                          
                          {ad.status === 'Approved' && (
                            <button
                              onClick={() => toggleVisibility(ad.advertisementID, ad.isHidden)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                ad.isHidden 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : 'bg-gray-500 text-white hover:bg-gray-600'
                              }`}
                              title={ad.isHidden ? 'Hiện bài viết' : 'Ẩn bài viết'}
                            >
                              {ad.isHidden ? (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Hiện
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Ẩn
                                </>
                              )}
                            </button>
                          )}
                          
                          {ad.status !== 'Deleted' && (
                            <>
                              <button
                                onClick={() => window.location.href = `/edit-post/${ad.advertisementID}`}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                              >
                                <Pencil className="w-4 h-4" />
                                Sửa
                              </button>
                              
                              <button
                                onClick={() => {
                                  setDeleteAdId(ad.advertisementID);
                                  setShowDeleteModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {ad.status === 'Rejected' && ad.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-1">Lý do từ chối:</p>
                          <p className="text-sm text-red-600">{ad.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Chi tiết tin đăng</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <img
                  src={selectedAd.image || 'https://via.placeholder.com/400'}
                  className="w-full h-64 object-cover rounded-lg"
                  alt={selectedAd.title}
                />

                <div className="flex gap-2">
                  <div>{getStatusBadge(selectedAd.status)}</div>
                  {selectedAd.isHidden && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-300">
                      <EyeOff className="w-4 h-4" />
                      Ẩn khỏi trang chủ
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Tiêu đề</label>
                  <p className="mt-1 text-lg font-semibold text-gray-800">{selectedAd.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Giá</label>
                  <p className="mt-1 text-xl font-bold text-blue-600">{formatPrice(selectedAd.price)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Danh mục</label>
                  <p className="mt-1 text-gray-800">{selectedAd.categoryName || 'Chưa phân loại'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Mô tả</label>
                  <p className="mt-1 text-gray-800 whitespace-pre-wrap">{selectedAd.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ngày đăng</label>
                    <p className="mt-1 text-gray-800">{formatDate(selectedAd.postDate)}</p>
                  </div>

                  {selectedAd.moderationDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ngày duyệt</label>
                      <p className="mt-1 text-gray-800">{formatDate(selectedAd.moderationDate)}</p>
                    </div>
                  )}
                </div>

                {selectedAd.moderatedByUserName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Người duyệt</label>
                    <p className="mt-1 text-gray-800">{selectedAd.moderatedByUserName}</p>
                  </div>
                )}

                {selectedAd.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <label className="text-sm font-medium text-red-800">Lý do từ chối</label>
                    <p className="mt-1 text-red-600">{selectedAd.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Xác nhận xóa</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa tin đăng này? Hành động này không thể hoàn tác.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdsManagement;