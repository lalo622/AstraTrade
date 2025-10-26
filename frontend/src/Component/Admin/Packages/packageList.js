import React, { useEffect, useState } from "react";
import api from "../../../Service/Vipapi";
import PackageForm from "./PackageForm";
import "./PackageManager.css";

export default function PackageList() {
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadPackages = async () => {
    try {
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (err) {
      setError("Không thể tải danh sách gói!");
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói này?")) return;
    try {
      await api.delete(`/packages/${id}`);
      loadPackages();
    } catch (err) {
      alert("Không thể xóa gói vì có người dùng đang sử dụng.");
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setShowForm(true);
  };

  const handleSave = async (data) => {
    try {
      if (editingPackage) {
        await api.put(`/packages/${editingPackage.packageID}`, data);
      } else {
        await api.post("/packages", data);
      }
      setShowForm(false);
      loadPackages();
    } catch (err) {
      alert("Lỗi khi lưu gói!");
    }
  };

  return (
    <div className="package-container">
      <h2>Quản lý Gói VIP</h2>

      {error && <p className="error">{error}</p>}

      {!showForm && (
        <>
          <button className="btn btn-primary" onClick={handleCreate}>
            + Thêm gói mới
          </button>

          <table className="package-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên gói</th>
                <th>Giá (VNĐ)</th>
                <th>Thời hạn (ngày)</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.packageID}>
                  <td>{p.packageID}</td>
                  <td>{p.name}</td>
                  <td>{p.price.toLocaleString()}</td>
                  <td>{p.duration}</td>
                  <td>
                    <button
                      className="btn btn-warning"
                      onClick={() => handleEdit(p)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(p.packageID)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showForm && (
        <PackageForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          packageData={editingPackage}
        />
      )}
    </div>
  );
}
