import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, RotateCcw, HelpCircle } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const message = searchParams.get('message') || 'Thanh toán thất bại';
  const code = searchParams.get('code');

  const getErrorMessage = () => {
    if (message) return decodeURIComponent(message);
    
    switch (code) {
      case '07':
        return 'Giao dịch bị nghi ngờ gian lận';
      case '09':
        return 'Thẻ chưa đăng ký dịch vụ thanh toán online';
      case '10':
        return 'Thông tin thẻ không chính xác';
      case '11':
        return 'Thẻ đã hết hạn';
      case '12':
        return 'Thẻ bị khóa';
      case '13':
        return 'Sai mật khẩu xác thực giao dịch';
      case '24':
        return 'Giao dịch bị hủy bởi người dùng';
      case '51':
        return 'Tài khoản không đủ số dư';
      case '65':
        return 'Vượt quá giới hạn giao dịch trong ngày';
      case '75':
        return 'Ngân hàng đang bảo trì';
      default:
        return 'Thanh toán không thành công. Vui lòng thử lại sau.';
    }
  };

  const getErrorIcon = () => {
    if (code === '24') {
      return '🚫'; // User cancelled
    }
    return '❌'; // Error
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Error Icon */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-red-400 to-orange-500 rounded-full w-24 h-24 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {code === '24' ? 'Đã hủy thanh toán' : 'Thanh toán thất bại'}
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            {getErrorMessage()}
          </p>

          {/* Error Details */}
          {code && (
            <div className="bg-red-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-red-500" />
                Thông tin lỗi
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mã lỗi:</span>
                  <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg text-red-600 font-semibold">
                    {code}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">
              💡 Gợi ý khắc phục
            </h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span>Kiểm tra thông tin thẻ và số dư tài khoản</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span>Đảm bảo thẻ đã được kích hoạt thanh toán online</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span>Thử lại với phương thức thanh toán khác</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span>Liên hệ ngân hàng nếu vấn đề tiếp tục xảy ra</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/packages')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Thử lại
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Cần hỗ trợ?{' '}
              <button
                onClick={() => navigate('/support')}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Liên hệ với chúng tôi
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;