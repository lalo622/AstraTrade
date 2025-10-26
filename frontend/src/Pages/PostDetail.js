import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./PostDetail.css";

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Gọi API bài đăng chi tiết theo ID
    const fetchPostDetail = async () => {
      try {
        const response = await fetch(`http://localhost:5234/api/advertisement/${id}`);
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu bài đăng");
        }
        const data = await response.json();
         if (data.categoryId) {
        const categoryRes = await fetch(`http://localhost:5234/api/category/${data.categoryId}`);
        const categoryData = await categoryRes.json();
        data.category = categoryData.name; // gán tên danh mục vào post
      }

        setPost(data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết bài đăng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [id]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (!post) return <div className="loading">Không tìm thấy bài đăng!</div>;

  return (
    <div className="post-detail-container">
      {/* --- Tiêu đề bài đăng --- */}
      <h1 className="post-title">{post.title}</h1>

      <div className="post-content">
        {/* --- Hình ảnh sản phẩm --- */}
        <div className="post-image">
          <img
            src={post.image || "https://via.placeholder.com/400x300?text=No+Image"}
            alt={post.title}
          />
        </div>

        {/* --- Thông tin chi tiết --- */}
        <div className="post-info">
          <p className="post-price">
            {post.price ? post.price.toLocaleString("vi-VN") + " ₫" : "Liên hệ"}
          </p>

          <p className="post-category">
            <strong>Danh mục:</strong> {post.category || "Chưa có"}
          </p>

          <p className="post-description">
            <strong>Mô tả chi tiết:</strong>
            <br />
            {post.description || "Chưa có mô tả cho sản phẩm này."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
