import axios from 'axios';

const API_BASE_URL = 'http://localhost:5234/api';

const userService = {
  // ✅ Lấy thông tin profile người dùng
  getUserProfile: async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ✅ Lấy thông tin VIP status
  getVIPStatus: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/vip-status/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ✅ Đổi mật khẩu 
  changePassword: async (oldPassword, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          oldPassword,
          newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ✅ Cập nhật thông tin profile
  updateProfile: async (userId, username, email) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile/${userId}`,
        {
          username,
          email
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default userService;