import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Eye, Loader } from 'lucide-react';

const AdminModerationPage = () => {
  const API_BASE_URL = 'http://localhost:5234/api/admin/admoderation';
  
  const [advertisements, setAdvertisements] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Lấy danh sách bài chờ duyệt
  const fetchPendingAds = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/pending?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.ok) throw new Error('Lỗi lấy dữ liệu');
      
      const data = await response.json();
      setAdvertisements(data.items || []);
      setTotalItems(data.totalItems || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Không thể lấy danh sách bài đăng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thống kê
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`);
      if (!response.ok) throw new Error('Lỗi lấy thống kê');
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Lỗi lấy thống kê:', err);
    }
  };

  useEffect(() => {
    fetchPendingAds(1);
    fetchStatistics();
  }, []);

  // Xem chi tiết bài đăng
  const handleViewDetail = async (adId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${adId}`);
      if (!response.ok) throw new Error('Lỗi lấy chi tiết');
      const data = await response.json();
      setSelectedAd(data);
      setShowDetailModal(true);
      setRejectReason('');
    } catch (err) {
      setError('Không thể lấy chi tiết bài đăng');
    }
  };

  // Mở modal confirm approve
  const handleOpenApproveConfirm = () => {
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  // Mở modal confirm reject
  const handleOpenRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  // Duyệt bài
  const handleApprove = async (adId) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertisementID: adId })
      });
      
      if (!response.ok) throw new Error('Lỗi duyệt bài');
      
      setSuccessMessage('✅ Duyệt bài thành công!');
      setShowDetailModal(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      fetchPendingAds(currentPage);
      fetchStatistics();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Lỗi duyệt bài: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Từ chối bài
  const handleReject = async (adId) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertisementID: adId,
          rejectionReason: rejectReason
        })
      });
      
      if (!response.ok) throw new Error('Lỗi từ chối bài');
      
      setSuccessMessage('❌ Từ chối bài thành công!');
      setRejectReason('');
      setShowDetailModal(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      fetchPendingAds(currentPage);
      fetchStatistics();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Lỗi từ chối bài: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Duyệt Bài Đăng</h1>
          <p className="text-gray-600">Xem xét và duyệt các bài đăng từ người dùng</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon="⏳" 
              label="Chờ duyệt" 
              value={statistics.pendingCount}
              color="bg-yellow-50 border-yellow-200"
            />
            <StatCard 
              icon="✅" 
              label="Đã duyệt" 
              value={statistics.approvedCount}
              color="bg-green-50 border-green-200"
            />
            <StatCard 
              icon="❌" 
              label="Từ chối" 
              value={statistics.rejectedCount}
              color="bg-red-50 border-red-200"
            />
            <StatCard 
              icon="📊" 
              label="Tổng cộng" 
              value={statistics.totalCount}
              color="bg-blue-50 border-blue-200"
            />
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <>
            {/* Advertisements Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {advertisements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Không có bài đăng nào chờ duyệt</p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tiêu đề</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Danh mục</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giá</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Người đăng</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày đăng</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {advertisements.map((ad) => (
                        <tr key={ad.advertisementID} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-600">#{ad.advertisementID}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800 truncate max-w-xs">
                            {ad.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ad.categoryName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                            {ad.price ? `${ad.price.toLocaleString()}đ` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ad.postedByUserName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(ad.postDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleViewDetail(ad.advertisementID)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition text-xs font-medium"
                            >
                              <Eye size={16} />
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Hiển thị {advertisements.length} / {totalItems} bài
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchPendingAds(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-gray-700">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => fetchPendingAds(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Chi tiết bài đăng #{selectedAd.advertisementID}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setError(null);
                }}
                className="text-xl hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Image */}
              {selectedAd.image && (
                <div className="mb-4">
                  <img
                    src={selectedAd.image}
                    alt="Ad"
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                    }}
                  />
                </div>
              )}

              {/* Title & Price */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedAd.title}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedAd.price ? `${selectedAd.price.toLocaleString()}đ` : 'Liên hệ'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Danh mục</p>
                  <p className="font-semibold text-gray-800">{selectedAd.categoryName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loại tin</p>
                  <p className="font-semibold text-gray-800">{selectedAd.adType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Người đăng</p>
                  <p className="font-semibold text-gray-800">{selectedAd.postedByUserName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày đăng</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedAd.postDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Mô tả chi tiết</p>
                <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedAd.description}</p>
                </div>
              </div>

              {/* Reject Reason Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Lý do từ chối (nếu từ chối) *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setError(null);
                  }}
                  placeholder="Nhập lý do từ chối bài đăng này..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setError(null);
                  setRejectReason('');
                }}
                disabled={submitting}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                onClick={handleOpenRejectConfirm}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle size={18} />
                Từ chối
              </button>
              <button
                onClick={handleOpenApproveConfirm}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {confirmAction === 'approve' ? '✅ Xác nhận duyệt bài' : '❌ Xác nhận từ chối bài'}
              </h2>
              <p className="text-gray-600 mb-6">
                {confirmAction === 'approve' 
                  ? 'Bạn có chắc muốn duyệt bài đăng này? Bài sẽ hiển thị trên trang chủ.'
                  : `Lý do từ chối: "${rejectReason}"`
                }
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (confirmAction === 'approve') {
                      handleApprove(selectedAd.advertisementID);
                    } else {
                      handleReject(selectedAd.advertisementID);
                    }
                  }}
                  disabled={submitting}
                  className={`px-4 py-2 text-white rounded transition disabled:opacity-50 ${
                    confirmAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <div className={`${color} border rounded-lg p-4`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);

export default AdminModerationPage;