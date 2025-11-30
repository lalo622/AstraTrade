import React, { useState } from "react";
import { authAPI } from "../Service/AuthApi";
import { toast } from "react-toastify";
import "./Auth.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP + mật khẩu mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      toast.success("✅ Mã OTP đã gửi đến email của bạn.");
      setStep(2);
      startCountdown();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể gửi OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.resetPassword(email, otp, newPassword);
      toast.success("🎉 Mật khẩu đã được đặt lại!");
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    try {
      await authAPI.forgotPassword(email);
      toast.success("Đã gửi lại mã OTP.");
      startCountdown();
    } catch {
      toast.error("Không thể gửi lại OTP.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Quên mật khẩu</h2>

        {step === 1 ? (
          <form onSubmit={sendOtp}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Nhập email đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            <div className="form-group">
              <label>Mã OTP</label>
              <input
                type="text"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
            <button
              type="button"
              className="btn-resend"
              onClick={resendOtp}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Gửi lại OTP (${countdown}s)` : "Gửi lại OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
