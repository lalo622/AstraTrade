import axios from "axios";

const API_URL = "http://localhost:5234/api/Auth";

export const authAPI = {
  // Gửi OTP đăng ký
  sendOtp: (email) => 
    axios.post(`${API_URL}/send-otp`, { email }).then(res => res.data),
  
  
  verifyOtp: (email, password, otp, username) =>
    axios.post(`${API_URL}/verify-otp`, { email, password, otp, username }).then(res => res.data),
  
  // Đăng nhập
  login: (credentials) => 
    axios.post(`${API_URL}/login`, credentials).then(res => res.data),
  
  
  forgotPassword: (email) =>
    axios.post(`${API_URL}/forgot-password`, { email }).then(res => res.data),
  
  resetPassword: (email, otp, newPassword) =>
    axios.post(`${API_URL}/reset-password`, { email, otp, newPassword }).then(res => res.data),
};