import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, Loader, Check, X } from "lucide-react";

const AdminVipPackagePage = () => {
  const API_BASE_URL = "http://localhost:5234/api/admin/packages";

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "", duration: "" });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch packages
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Lỗi tải danh sách gói VIP");
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Open modal (create or edit)
  const openModal = (pkg = null) => {
    setEditingPackage(pkg);
    if (pkg) {
      setFormData({
        name: pkg.name,
        price: pkg.price,
        duration: pkg.duration,
      });
    } else {
      setFormData({ name: "", price: "", duration: "" });
    }
    setShowModal(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const method = editingPackage ? "PUT" : "POST";
      const url = editingPackage
        ? `${API_BASE_URL}/${editingPackage.packageID}`
        : API_BASE_URL;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
        }),
      });

      if (!response.ok) throw new Error("Lỗi lưu dữ liệu");

      setSuccessMessage(editingPackage ? "Cập nhật thành công!" : "Thêm mới thành công!");
      setShowModal(false);
      setEditingPackage(null);
      fetchPackages();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete package
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói này không?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Không thể xóa gói");
      }
      setSuccessMessage("Xóa gói thành công!");
      fetchPackages();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Quản lý Gói VIP
            </h1>
            <p className="text-gray-600">Thêm, chỉnh sửa, và xóa các gói VIP</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle size={18} />
            Thêm gói mới
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên gói</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giá (VNĐ)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thời hạn (ngày)</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg.packageID} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">#{pkg.packageID}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{pkg.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{pkg.price.toLocaleString()}đ</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{pkg.duration}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openModal(pkg)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Pencil size={16} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.packageID)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {packages.length === 0 && (
              <div className="p-8 text-center text-gray-500">Chưa có gói nào</div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {editingPackage ? "Chỉnh sửa gói VIP" : "Thêm gói VIP mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white text-xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tên gói</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Giá (VNĐ)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Thời hạn (ngày)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
              >
                {submitting ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                {editingPackage ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVipPackagePage;
