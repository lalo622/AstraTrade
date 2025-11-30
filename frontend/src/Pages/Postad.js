import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import { Camera, Upload, X, MapPin, Home } from "lucide-react";

function PostAd() {
  const [categories, setCategories] = useState([]);
  const [wards, setWards] = useState([]);
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  
  const fileInputRef = useRef(null);
  const API_BASE_URL = "http://localhost:5234/api";

 const [form, setForm] = useState({
  title: "",
  description: "",
  price: "",
  categoryId: "",
  ward: "",
  addressDetail: "",
  image: "",
});

  // 1. Load Categories (Danh mục)
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/admin/category`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Lỗi lấy danh mục:", err));
  }, []);
  useEffect(() => {
  setLoadingWards(true);
  axios
    .get(`${API_BASE_URL}/advertisement/wards`)
    .then((res) => {
      const data = res.data.wards || res.data;
      if (Array.isArray(data)) {
        setWards(data);
      } else {
        setWards([]);
      }
    })
    .catch((err) => {
      console.error("Lỗi lấy phường/xã:", err);
      setWards([]);
    })
    .finally(() => setLoadingWards(false));
}, []);


  // Handle image select
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 5MB!');
      return;
    }
    
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Remove image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image function
  const uploadImageToServer = async () => {
    if (!selectedImage) return null;

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await axios.post(
        `${API_BASE_URL}/Advertisement/upload-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      // Trả về đường dẫn đầy đủ
      return `http://localhost:5234${res.data.imageUrl}`;
    } catch (err) {
      console.error("Upload image failed:", err);
      throw new Error("Lỗi upload ảnh");
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation cơ bản
    if (!form.title || !form.categoryId || !form.price) {
      alert("Vui lòng điền đầy đủ thông tin sản phẩm!");
      return;
    }

  if (!form.ward || !form.addressDetail) {
    alert("Vui lòng điền đầy đủ địa chỉ giao dịch!");
    return;
  }

    if (!user) {
      alert("Vui lòng đăng nhập để đăng tin!");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload ảnh trước (nếu có)
      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await uploadImageToServer();
      }

      // 2. Chuẩn bị dữ liệu gửi đi
      const requestData = {
        title: form.title,
        description: form.description || "",
        price: parseFloat(form.price),
        categoryID: parseInt(form.categoryId),
        image: imageUrl,
        userID: user.id, 
        ward: form.ward,
        addressDetail: form.addressDetail
      };

      console.log("📤 Sending Data:", requestData);
      
      // 3. Gọi API đăng tin
      const res = await axios.post(
        `${API_BASE_URL}/Advertisement/post-ad`,
        requestData
      );

      alert(res.data.message || "Đăng tin thành công!");

      // 4. Reset form sau khi thành công
      setForm({
        title: "",
        description: "",
        price: "",
        categoryId: "",

        ward: "",
        addressDetail: "",
        image: "",
      });
      handleRemoveImage();
      
    } catch (err) {
      console.error(" Error posting ad:", err);
      const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra, vui lòng thử lại.";
      alert("Đăng tin thất bại: " + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Đăng tin mới
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Upload Ảnh */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Hình ảnh sản phẩm
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Đăng tối đa 1 hình ảnh (tối đa 5MB)
              </p>

              <div
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-300 relative overflow-hidden
                  ${imagePreview 
                    ? 'border-gray-300 bg-gray-50 p-2' 
                    : 'border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-600'
                  }
                `}
              >
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                    <p className="text-blue-600 font-medium">Chọn ảnh để tải lên</p>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG (max 5MB)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          {/* Cột phải: Form thông tin */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-6">
              
              {/* Tiêu đề & Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Bán xe máy Honda Wave RSX 2023"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả tình trạng, xuất xứ, bảo hành..."
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              {/* Giá & Danh mục */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="VD: 15000000"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryID} value={cat.categoryID}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phần Địa chỉ - Quan trọng */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Khu vực & Địa chỉ
                </h3>

                <div className="space-y-4">
                  {/* Phường/Xã */}
                        <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phường/Xã <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.ward}
                    onChange={(e) => setForm({ ...form, ward: e.target.value })}
                    disabled={loadingWards}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {loadingWards 
                        ? "Đang tải Phường/Xã..." 
                        : "-- Chọn Phường/Xã --"
                      }
                    </option>
                    {wards.map((ward, index) => (
                      <option key={index} value={ward.name}>
                        {ward.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                  {/* Địa chỉ cụ thể */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số nhà, Tên đường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.addressDetail}
                      onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                      placeholder="VD: 123 Đường Nguyễn Huệ"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  {/* Preview Địa chỉ */}
                 {form.ward && form.addressDetail && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                        Địa chỉ hiển thị:
                      </p>
                      <p className="font-medium text-gray-800 flex items-start gap-2">
                        <Home className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          {form.addressDetail}, {form.ward}, TP. Hồ Chí Minh
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nút Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Đang xử lý...
                  </>
                ) : (
                  "Đăng tin ngay"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostAd;