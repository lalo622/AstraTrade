
import axios from "axios";

const API_URL = "http://localhost:5234/api/Auth";

export const authAPI = {
  sendOtp: (email) => axios.post(`${API_URL}/send-otp`, { email }).then(res => res.data),
  verifyOtp: (email, password, otp) =>
    axios.post(`${API_URL}/verify-otp`, { email, password, otp }).then(res => res.data),
  login: (credentials) => 
    axios.post(`${API_URL}/login`, credentials).then(res => res.data),
};
