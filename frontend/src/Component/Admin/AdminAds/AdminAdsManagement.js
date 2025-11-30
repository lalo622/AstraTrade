import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminAdsManagement = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    targetUrl: "",
    isActive: false,
    bannerFile: null
  });
  const [previewImage, setPreviewImage] = useState(null);

  const API_BASE = "http://localhost:5234/api/admin/ads";

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE);
      setAds(response.data);
    } catch (error) {
      console.error("Error fetching ads:", error);
      alert("Không thể tải danh sách quảng cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        name: ad.name,
        targetUrl: ad.targetUrl,
        isActive: ad.isActive,
        bannerFile: null
      });
      setPreviewImage(`http://localhost:5234${ad.imageUrl}`);
    } else {
      setEditingAd(null);
      setFormData({
        name: "",
        targetUrl: "",
        isActive: false,
        bannerFile: null
      });
      setPreviewImage(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setFormData({
      name: "",
      targetUrl: "",
      isActive: false,
      bannerFile: null
    });
    setPreviewImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, bannerFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên quảng cáo");
      return;
    }

    if (!formData.targetUrl.trim()) {
      alert("Vui lòng nhập URL đích");
      return;
    }

    if (!editingAd && !formData.bannerFile) {
      alert("Vui lòng chọn ảnh banner");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("targetUrl", formData.targetUrl);
    formDataToSend.append("isActive", formData.isActive);

    if (formData.bannerFile) {
      if (editingAd) {
        formDataToSend.append("newBannerFile", formData.bannerFile);
      } else {
        formDataToSend.append("bannerFile", formData.bannerFile);
      }
    }

    try {
      if (editingAd) {
        await axios.put(`${API_BASE}/${editingAd.adID}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        alert("Cập nhật quảng cáo thành công");
      } else {
        await axios.post(API_BASE, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        alert("Thêm quảng cáo thành công");
      }
      handleCloseModal();
      fetchAds();
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Có lỗi xảy ra khi lưu quảng cáo");
    }
  };

  const handleToggleActive = async (ad) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", ad.name);
    formDataToSend.append("targetUrl", ad.targetUrl);
    formDataToSend.append("isActive", !ad.isActive);

    try {
      await axios.put(`${API_BASE}/${ad.adID}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchAds();
    } catch (error) {
      console.error("Error toggling ad status:", error);
      alert("Không thể thay đổi trạng thái");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/${id}`);
      alert("Xóa quảng cáo thành công");
      fetchAds();
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Không thể xóa quảng cáo");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý quảng cáo</h1>
          <p className="text-gray-600">Quản lý banner quảng cáo hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm quảng cáo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {ads.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 text-lg">Chưa có quảng cáo nào</p>
            <p className="text-gray-500 text-sm mt-2">Nhấn nút "Thêm quảng cáo" để bắt đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên quảng cáo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL đích
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.adID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={`http://localhost:5234${ad.imageUrl}`}
                        alt={ad.name}
                        className="h-16 w-24 object-cover rounded border border-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ad.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={ad.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {ad.targetUrl}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          ad.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            ad.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className={`ml-2 text-sm ${ad.isActive ? "text-green-600" : "text-gray-500"}`}>
                        {ad.isActive ? "Đang hiển thị" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(ad)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(ad.adID)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAd ? "Chỉnh sửa quảng cáo" : "Thêm quảng cáo mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên quảng cáo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên quảng cáo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL đích
                </label>
                <input
                  type="url"
                  name="targetUrl"
                  value={formData.targetUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner quảng cáo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Định dạng: JPG, PNG, GIF. Kích thước đề xuất: 300x100px
                </p>
              </div>

              {previewImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xem trước
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Hiển thị quảng cáo này trên trang chủ
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingAd ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdsManagement;