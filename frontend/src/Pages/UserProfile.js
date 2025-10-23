import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import userService from '../Service/userService';
import { toast } from 'react-toastify';
import { 
  User, 
  Crown, 
  Calendar, 
  ArrowRight, 
  Shield, 
  Mail,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Lock
} from 'lucide-react';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.id) {
      toast.error('Vui lòng đăng nhập để xem trang cá nhân');
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // ✅ SỬA: Dùng user.id thay vì user.userId
      const data = await userService.getUserProfile(user.id);
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/packages');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setPasswordLoading(true);
      await userService.changePassword(passwords.oldPassword, passwords.newPassword);
      toast.success('Mật khẩu đã được thay đổi thành công');
      setShowChangePassword(false);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Lỗi khi thay đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isVIPExpiringSoon = () => {
    if (!profileData?.isVIP || !profileData?.vipExpiryDate) return false;
    const daysLeft = Math.ceil((new Date(profileData.vipExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          {/* Banner */}
          <div className={`h-32 ${profileData?.isVIP 
            ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }`}>
            <div className="flex items-center justify-end h-full px-6">
              {profileData?.isVIP && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Crown className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">Thành viên VIP</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-start gap-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-4 ring-white shadow-xl">
                  <User className="w-16 h-16 text-white" />
                </div>
                {profileData?.isVIP && (
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 ring-4 ring-white">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 mt-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profileData?.username}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Mail className="w-4 h-4" />
                  <span>{profileData?.email}</span>
                </div>
                
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100">
                  {profileData?.isVIP ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900">Tài khoản VIP</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">Tài khoản Free</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Status / Upgrade Card */}
        {profileData?.isVIP ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 mb-8 border-2 border-orange-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Gói {profileData.vipPackageName || 'VIP'}
                    </h3>
                    <p className="text-gray-600">Đang hoạt động</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <span>Ngày hết hạn: <strong>{formatDate(profileData.vipExpiryDate)}</strong></span>
                  </div>
                  
                  {isVIPExpiringSoon() && (
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-100 px-4 py-2 rounded-lg">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Gói VIP sắp hết hạn!</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpgradeClick}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                Gia hạn ngay
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Nâng cấp lên VIP</h3>
                  </div>

                  <p className="text-blue-100 mb-6 max-w-lg">
                    Mở khóa toàn bộ tính năng cao cấp, truy cập không giới hạn và nhận được hỗ trợ ưu tiên từ đội ngũ chúng tôi
                  </p>

                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span>Không giới hạn quảng cáo</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span>Ưu tiên hiển thị</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span>Hỗ trợ 24/7</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpgradeClick}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                <Crown className="w-6 h-6" />
                Xem gói VIP
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Ngày tham gia</p>
                <p className="text-gray-900 font-semibold">{formatDate(profileData?.joinDate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Trạng thái</p>
                <p className="text-gray-900 font-semibold">
                  {profileData?.isVIP ? 'VIP Active' : 'Free Plan'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Tổng quảng cáo</p>
                <p className="text-gray-900 font-semibold">{profileData?.totalAds || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt tài khoản</h3>
          
          {/* Change Password Section */}
          {!showChangePassword ? (
            <div className="space-y-3">
              <button 
                onClick={() => setShowChangePassword(true)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  <span className="text-gray-700 group-hover:text-gray-900">Đổi mật khẩu</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:text-red-700 font-medium flex items-center gap-3"
              >
                <span>🚪</span>
                Đăng xuất
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="font-semibold text-gray-900">Đổi mật khẩu</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu cũ
                </label>
                <input
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập mật khẩu cũ"
                  disabled={passwordLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập mật khẩu mới"
                  disabled={passwordLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Xác nhận mật khẩu mới"
                  disabled={passwordLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {passwordLoading ? 'Đang xử lý...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;