import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { authAPI } from "../Service/AuthApi";
import { toast } from "react-toastify";
import "./Auth.css";

function Login({ switchToRegister }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.login({ email, password });
      login(response);
      toast.success("🎉 Đăng nhập thành công!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Đăng Nhập</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth">Đăng nhập</button>
        </form>

        <p className="auth-footer">
          Chưa có tài khoản?{" "}
          <a href="#" className="auth-link" onClick={switchToRegister}>
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
