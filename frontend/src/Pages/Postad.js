import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import "./Postad.css";

function PostAd() {
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    image: "",
  });

  // Lấy danh mục khi load trang
  useEffect(() => {
    axios
      .get("http://localhost:5234/api/admin/category")
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => console.error("Lỗi lấy danh mục:", err));
  }, []);

  // Xử lý chọn ảnh
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Kích hoạt input file
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Upload ảnh lên server
  const uploadImageToServer = async () => {
    if (!selectedImage) {
      return "https://placehold.co/600x400/007bff/white?text=No+Image";
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await axios.post(
        "http://localhost:5234/api/Advertisement/upload-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const imageUrl = `http://localhost:5234${res.data.imageUrl}`;
      return imageUrl;
    } catch (err) {
      console.error("Upload image failed:", err);
      return "https://placehold.co/600x400/007bff/white?text=Upload+Error";
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.categoryId || !form.price) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (!user) {
      alert("Vui lòng đăng nhập để đăng tin!");
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadImageToServer();

      const requestData = {
        title: form.title,
        description: form.description || "",
        price: parseFloat(form.price),
        categoryID: parseInt(form.categoryId),
        image: imageUrl,
        userID: user.id,
      };

      console.log("📤 Gửi dữ liệu:", requestData);
      const res = await axios.post(
        "http://localhost:5234/api/Advertisement/post-ad",
        requestData
      );

      alert(res.data.message || "Đăng tin thành công!");

      setForm({
        title: "",
        description: "",
        price: "",
        categoryId: "",
        image: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error("❌ Lỗi đăng tin:", err.response?.data);
      alert(
        "Đăng tin thất bại: " +
          (err.response?.data?.message || "Vui lòng kiểm tra lại.")
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="postad-container">
      {user ? (
        <div className="user-info">
          <p>
            Đăng tin với tư cách:{" "}
            <strong>{user.username || user.email}</strong> (ID: {user.id})
          </p>
        </div>
      ) : (
        <div className="user-warning">
          <p style={{ color: "red" }}>⚠️ Bạn chưa đăng nhập!</p>
        </div>
      )}

      <div className="postad-layout">
        {/* Khu vực upload ảnh */}
        <div className="image-upload-section">
          <h3>Hình ảnh sản phẩm</h3>
          <p className="upload-info">Đăng 1 hình ảnh</p>

          <div className="image-upload-area" onClick={triggerFileInput}>
            <div className="upload-placeholder">
              <span className="upload-icon">📷</span>
              <p>Chọn ảnh</p>
              {uploading && <div className="uploading-text">Đang upload...</div>}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              style={{ display: "none" }}
              disabled={uploading}
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        {/* Form thông tin tin đăng */}
        <div className="form-section">
          <form onSubmit={handleSubmit} className="postad-form">
            <div className="form-group">
              <label className="form-label required">Tiêu đề</label>
              <input
                name="title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                required
                placeholder="Nhập tiêu đề tin đăng"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả chi tiết</label>
              <textarea
                name="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả chi tiết sản phẩm"
                rows="5"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Giá</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
                required
                placeholder="Nhập giá"
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Danh mục</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                required
                className="form-select"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.categoryID} value={cat.categoryID}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? "Đang đăng..." : "Đăng tin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostAd;
