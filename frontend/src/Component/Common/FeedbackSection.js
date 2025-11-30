import React, { useState, useEffect } from "react";
import { Star, Send, MessageSquare, Trash2, Edit2, AlertCircle } from "lucide-react";
import StarRating from "./StarRating";

const FeedbackSection = ({ advertisementId, currentUser }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Tải danh sách feedback
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5234/api/feedback/ad/${advertisementId}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Lỗi khi tải feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [advertisementId]);

  // Gửi feedback mới
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Bạn cần đăng nhập để đánh giá!");
      return;
    }

    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId 
        ? `http://localhost:5234/api/feedback/${editingId}`
        : "http://localhost:5234/api/feedback";
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: rating,
          comment: comment.trim() || null,
          userID: currentUser.id,
          advertisementID: parseInt(advertisementId)
        })
      });

      if (response.ok) {
        setRating(0);
        setComment("");
        setShowForm(false);
        setEditingId(null);
        loadFeedbacks();
        alert(editingId ? "Cập nhật đánh giá thành công!" : "Đánh giá của bạn đã được gửi!");
      } else {
        const error = await response.json();
        alert(error.message || "Có lỗi xảy ra khi gửi đánh giá");
      }
    } catch (error) {
      console.error("Lỗi khi gửi feedback:", error);
      alert("Không thể gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Chỉnh sửa feedback
  const handleEditFeedback = (feedback) => {
    setEditingId(feedback.feedbackID);
    setRating(feedback.score);
    setComment(feedback.comment || "");
    setShowForm(true);
  };

  // Xóa feedback
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const response = await fetch(`http://localhost:5234/api/feedback/${feedbackId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadFeedbacks();
        alert("Đã xóa đánh giá!");
      }
    } catch (error) {
      console.error("Lỗi khi xóa feedback:", error);
      alert("Không thể xóa đánh giá!");
    }
  };

  // Hủy form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setRating(0);
    setComment("");
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    if (hours < 48) return "Hôm qua";
    
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Render sao
  const renderStars = (score) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Tính điểm trung bình
  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đánh giá & Nhận xét</h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center space-x-2">
              <span>{feedbacks.length} đánh giá</span>
              <span>•</span>
              <span className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                {averageRating}/5
              </span>
            </p>
          </div>
        </div>
        
        {!showForm && currentUser && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Star className="w-4 h-4" />
            <span>Viết đánh giá</span>
          </button>
        )}
        
        {!showForm && !currentUser && (
          <div className="text-sm text-gray-500 italic">
            Đăng nhập để đánh giá
          </div>
        )}
      </div>

      {/* Form đánh giá */}
      {showForm && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 animate-fadeIn">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
            {editingId ? "Chỉnh sửa đánh giá" : "Đánh giá của bạn"}
          </h3>
          <form onSubmit={handleSubmitFeedback}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn số sao <span className="text-red-500">*</span>
              </label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét của bạn
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows="4"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{editingId ? "Cập nhật" : "Gửi đánh giá"}</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách feedback */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải đánh giá...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Chưa có đánh giá nào</p>
            <p className="text-sm text-gray-500">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div
              key={feedback.feedbackID}
              className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {feedback.userName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{feedback.userName}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {renderStars(feedback.score)}
                      <span className="text-xs text-gray-500">• {formatDateTime(feedback.dateTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Nút sửa/xóa nếu là người dùng hiện tại */}
                {currentUser && currentUser.id === feedback.userID && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditFeedback(feedback)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(feedback.feedbackID)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {feedback.comment && (
                <p className="text-gray-700 leading-relaxed ml-13 pl-2 border-l-2 border-blue-200">
                  {feedback.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackSection;