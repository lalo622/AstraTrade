import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { MapPin, List, Map as MapIcon, Navigation, Loader, Search, Filter, AlertCircle } from 'lucide-react';
import axios from 'axios';

const NearbyPostsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [viewMode, setViewMode] = useState('list');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSource, setLocationSource] = useState(null); // 'database' hoặc 'gps'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    getUserLocation();
  }, [user]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPosts();
    }
  }, [userLocation, radius]);

  const getUserLocation = async () => {
    setGettingLocation(true);
    setErrorMessage('');

    try {
      // ✅ Ưu tiên: Lấy từ DATABASE của user
      console.log('🔍 Fetching user location from database...');
      const response = await axios.get(
        `http://localhost:5234/api/auth/profile/${user.id}`,
        {
          headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
        }
      );

      const userData = response.data;
      console.log('📍 User data:', userData);

      if (userData.currentLatitude && userData.currentLongitude) {
        const location = {
          lat: userData.currentLatitude,
          lng: userData.currentLongitude,
          address: userData.currentLocation || `${userData.ward}, ${userData.address}`
        };
        setUserLocation(location);
        setLocationSource('database');
        console.log('✅ Using location from database:', location);
        setGettingLocation(false);
        return;
      }

      console.log('⚠️ User has no location in database, trying GPS...');
      // Nếu user chưa có địa chỉ trong DB → dùng GPS
      useGPSLocation();

    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      setErrorMessage('Không thể lấy địa chỉ từ tài khoản. Đang dùng GPS...');
      useGPSLocation();
    }
  };

  const useGPSLocation = () => {
    console.log('📡 Trying to get GPS location...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationSource('gps');
          console.log('✅ Using GPS location:', location);
          setGettingLocation(false);
        },
        (error) => {
          console.error('❌ GPS error:', error);
          // Fallback: Trung tâm TP.HCM
          const fallback = { 
            lat: 10.8231, 
            lng: 106.6297,
            address: 'TP. Hồ Chí Minh (mặc định)'
          };
          setUserLocation(fallback);
          setLocationSource('fallback');
          setErrorMessage('Không thể lấy vị trí. Đang dùng vị trí mặc định TP.HCM');
          console.log('⚠️ Using fallback location');
          setGettingLocation(false);
        }
      );
    } else {
      // Fallback
      const fallback = { 
        lat: 10.8231, 
        lng: 106.6297,
        address: 'TP. Hồ Chí Minh (mặc định)'
      };
      setUserLocation(fallback);
      setLocationSource('fallback');
      setErrorMessage('Trình duyệt không hỗ trợ GPS. Đang dùng vị trí mặc định');
      setGettingLocation(false);
    }
  };

  const fetchNearbyPosts = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching nearby posts with:', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radius
      });

      const response = await axios.get(
        `http://localhost:5234/api/advertisement/nearby`,
        {
          params: {
            userLat: userLocation.lat,
            userLng: userLocation.lng,
            radiusKm: radius,
            pageSize: 50
          },
          headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
        }
      );

      if (response.data.success) {
        console.log('✅ Found nearby posts:', response.data.ads?.length || 0);
        setPosts(response.data.ads || []);
      }
    } catch (error) {
      console.error('❌ Error fetching nearby posts:', error);
      setErrorMessage('Không thể tải bài đăng gần bạn');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleUpdateAddress = () => {
    navigate('/profile');
  };

  if (gettingLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang xác định vị trí của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bài đăng gần bạn</h1>
                <p className="text-sm text-gray-600">Tìm thấy {posts.length} bài đăng</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
                Danh sách
              </button>
            </div>
          </div>
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">{errorMessage}</p>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Bán kính:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>

            <button
              onClick={getUserLocation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Làm mới vị trí
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Không có bài đăng nào gần bạn</p>
            <p className="text-gray-500 text-sm mb-4">Thử tăng bán kính tìm kiếm</p>
            {locationSource !== 'database' && (
              <button
                onClick={handleUpdateAddress}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Cập nhật địa chỉ của bạn
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.advertisementID}
                onClick={() => handlePostClick(post.advertisementID)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden group"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Distance Badge */}
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {post.distanceText}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {post.title}
                  </h3>
                  
                  <p className="text-red-600 font-bold text-xl mb-3">
                    {formatPrice(post.price)}
                  </p>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{post.locationName || post.locationAddress}</span>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {post.category?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.postDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyPostsPage;