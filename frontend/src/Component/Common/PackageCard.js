import React from 'react';
import { Check } from 'lucide-react';

const PackageCard = ({ pkg, onSelect, isPopular = false }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDuration = (duration) => {
    if (duration === 30) return '1 tháng';
    if (duration === 90) return '3 tháng';
    if (duration === 180) return '6 tháng';
    if (duration === 365) return '1 năm';
    return `${duration} ngày`;
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
      isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
    }`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
          Phổ biến nhất
        </div>
      )}

      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">{formatPrice(pkg.price)}</span>
          <span className="text-gray-500 ml-2">/ {formatDuration(pkg.duration)}</span>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Truy cập không giới hạn các tính năng VIP</span>
          </div>
          <div className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Xem trước các tính năng mới</span>
          </div>
          <div className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Hỗ trợ ưu tiên 24/7</span>
          </div>
          <div className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Không có quảng cáo</span>
          </div>
        </div>

        <button
          onClick={() => onSelect(pkg)}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
            isPopular
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          Chọn gói này
        </button>
      </div>
    </div>
  );
};

export default PackageCard;