import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import userService from '../Service/userService';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  User, Crown, Calendar, ArrowRight, Mail, Sparkles,
  Clock, CheckCircle, XCircle, Loader2, Lock, MapPin, Home, Edit2
} from 'lucide-react';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Location states - CHỈ CÒN WARDS
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [locationForm, setLocationForm] = useState({
    ward: '',
    addressDetail: ''
  });
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    if (!user || !userId) {
      toast.error('Vui lòng đăng nhập để xem trang cá nhân');
      navigate('/login');
      return;
    }
    fetchUserProfile();
    loadWards(); // Gọi trực tiếp load wards
  }, [user, userId, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile(userId);
      setProfileData(data);
      
      // Pre-fill location if exists
      if (data.ward || data.address) {
        setLocationForm({
          ward: data.ward || '',
          addressDetail: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async () => {
    setLoadingWards(true);
    try {
      const response = await axios.get('http://localhost:5234/api/advertisement/wards');
      if (response.data.success) {
        setWards(response.data.wards);
        console.log('✅ Loaded wards:', response.data.wards.length);
      }
    } catch (error) {
      console.error('Error loading wards:', error);
      toast.error('Không thể tải danh sách phường/xã');
    } finally {
      setLoadingWards(false);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();

    if (!locationForm.ward || !locationForm.addressDetail) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    setSavingLocation(true);
    try {
      await userService.updateUserLocation(userId, {
        ward: locationForm.ward,
        address: locationForm.addressDetail
      });

      toast.success('Cập nhật địa chỉ thành công');
      setShowEditLocation(false);
      fetchUserProfile();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi cập nhật địa chỉ');
    } finally {
      setSavingLocation(false);
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
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
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

          <div className="px-8 pb-8">
            <div className="flex items-start gap-6 -mt-16">
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

              <div className="flex-1 mt-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profileData?.username}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Mail className="w-4 h-4" />
                  <span>{profileData?.email}</span>
                </div>

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

        {/* Location Card - CHỈ PHƯỜNG/XÃ */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Địa chỉ của tôi
            </h3>
            <button
              onClick={() => setShowEditLocation(!showEditLocation)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {showEditLocation ? 'Hủy' : 'Chỉnh sửa'}
            </button>
          </div>

          {!showEditLocation ? (
            <div>
              {profileData?.ward || profileData?.address ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="flex items-start gap-2 text-gray-800">
                    <Home className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      {profileData.address && `${profileData.address}, `}
                      {profileData.ward && `${profileData.ward}, `}
                      TP. Hồ Chí Minh
                    </span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa cập nhật địa chỉ</p>
                  <button
                    onClick={() => setShowEditLocation(true)}
                    className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Thêm địa chỉ ngay
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phường/Xã <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationForm.ward}
                  onChange={(e) => setLocationForm({...locationForm, ward: e.target.value})}
                  disabled={loadingWards}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                  required
                >
                  <option value="">
                    {loadingWards ? "Đang tải..." : "-- Chọn Phường/Xã --"}
                  </option>
                  {wards.map((w, index) => (
                    <option key={index} value={w.name}>{w.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ cụ thể <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationForm.addressDetail}
                  onChange={(e) => setLocationForm({...locationForm, addressDetail: e.target.value})}
                  placeholder="VD: 123 Nguyễn Huệ"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {locationForm.ward && locationForm.addressDetail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Địa chỉ đầy đủ:</p>
                  <p className="font-medium text-gray-800">
                    {locationForm.addressDetail}, {locationForm.ward}, TP. Hồ Chí Minh
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={savingLocation}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {savingLocation ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
            </form>
          )}
        </div>

        {/* VIP Status */}
        {profileData?.isVIP ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-orange-200">
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
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition flex items-center gap-2"
              >
                Gia hạn ngay
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
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
                    Mở khóa toàn bộ tính năng cao cấp và nhận hỗ trợ ưu tiên
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
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpgradeClick}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition flex items-center gap-3"
              >
                <Crown className="w-6 h-6" />
                Xem gói VIP
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt tài khoản</h3>

          {!showChangePassword ? (
            <div className="space-y-3">
              <button 
                onClick={() => setShowChangePassword(true)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  <span className="text-gray-700 group-hover:text-gray-900">Đổi mật khẩu</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition text-red-600 hover:text-red-700 font-medium flex items-center gap-3"
              >
                <span>🚪</span>
                Đăng xuất
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="font-semibold text-gray-900">Đổi mật khẩu</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu cũ</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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