import axios from 'axios';

const API_BASE_URL = 'http://localhost:5234/api';

const paymentService = {
  // Lấy danh sách gói VIP
  getPackages: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/packages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching packages:', error);
      throw error;
    }
  },

  // Tạo URL thanh toán VNPay
  createPaymentUrl: async (userId, packageId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/payment/create-payment-url`, {
        userID: userId,
        packageID: packageId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment URL:', error);
      throw error;
    }
  },

  // Kiểm tra trạng thái thanh toán
  checkPaymentStatus: async (paymentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/check-status/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  // Lấy lịch sử thanh toán
  getPaymentHistory: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
};

export default paymentService;