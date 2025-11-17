import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, advertisementId, userId, token }) => {
  const [reportType, setReportType] = useState('Spam');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportTypes = [
    { value: 'Spam', label: '🚫 Spam / Quảng cáo rác', description: 'Tin đăng spam hoặc quảng cáo không phù hợp' },
    { value: 'Scam', label: '⚠️ Lừa đảo', description: 'Tin đăng có dấu hiệu lừa đảo' },
    { value: 'Inappropriate', label: '🔞 Nội dung không phù hợp', description: 'Nội dung vi phạm quy định cộng đồng' },
    { value: 'Fake', label: '❌ Hàng giả / Không đúng mô tả', description: 'Sản phẩm giả mạo hoặc sai sự thật' },
    { value: 'Other', label: '📝 Lý do khác', description: 'Vấn đề khác (vui lòng mô tả chi tiết)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do báo cáo!');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5234/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userID: userId,
          advertisementID: advertisementId,
          reason: reason,
          reportType: reportType
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ ' + data.message);
        onClose();
        setReason('');
        setReportType('Spam');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Không thể gửi báo cáo. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Báo cáo tin đăng</h2>
              <p className="text-sm text-gray-600">Giúp chúng tôi duy trì cộng đồng an toàn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Chọn loại vi phạm <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {reportTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    reportType === type.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1 w-5 h-5 text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vui lòng mô tả cụ thể vấn đề bạn gặp phải với tin đăng này..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="5"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Thông tin của bạn sẽ được bảo mật và chỉ dùng để xem xét báo cáo
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Báo cáo sai sự thật có thể bị xử lý</li>
                  <li>Chúng tôi sẽ xem xét báo cáo trong vòng 24-48 giờ</li>
                  <li>Bạn sẽ nhận thông báo kết quả qua email</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                '🚨 Gửi báo cáo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;