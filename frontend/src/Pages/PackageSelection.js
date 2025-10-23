import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import PackageCard from '../Component/Common/PackageCard';
import paymentService from '../Service/paymentService';
import { toast } from 'react-toastify';
import { Loader2, Shield, Zap, Star } from 'lucide-react';

const PackageSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

    useEffect(() => {
    if (!user) {
        toast.error('Vui lòng đăng nhập để tiếp tục');
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
        return;
    }
    fetchPackages();
    }, [user, navigate]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPackages();
      setPackages(data);
    } catch (error) {
      toast.error('Không thể tải danh sách gói VIP');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = async (pkg) => {
    if (processing) return;

    setSelectedPackage(pkg);
    setProcessing(true);

    try {
      const response = await paymentService.createPaymentUrl(user.id, pkg.packageID);
      
      toast.success('Đang chuyển đến trang thanh toán...');
      
      // Redirect to VNPay
      window.location.href = response.paymentUrl;
    } catch (error) {
      toast.error('Không thể tạo đơn thanh toán. Vui lòng thử lại.');
      console.error(error);
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải gói VIP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Nâng cấp tài khoản <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">VIP</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trải nghiệm đầy đủ các tính năng cao cấp và nhận được hỗ trợ ưu tiên
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Truy cập không giới hạn</h3>
            <p className="text-gray-600">Sử dụng toàn bộ tính năng VIP mà không bị giới hạn</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ưu đãi độc quyền</h3>
            <p className="text-gray-600">Nhận các ưu đãi và tính năng mới trước người khác</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hỗ trợ ưu tiên</h3>
            <p className="text-gray-600">Được hỗ trợ nhanh chóng bởi đội ngũ chuyên nghiệp</p>
          </div>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg, index) => (
            <PackageCard
              key={pkg.packageID}
              pkg={pkg}
              onSelect={handleSelectPackage}
              isPopular={index === 1} // Gói giữa là phổ biến nhất
            />
          ))}
        </div>

        {/* Processing Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Đang xử lý thanh toán
              </h3>
              <p className="text-gray-600 mb-4">
                Vui lòng chờ trong giây lát...
              </p>
              {selectedPackage && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Gói: <span className="font-semibold">{selectedPackage.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageSelection;