import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../Service/AuthApi';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate(); // ✅ Dùng để chuyển trang
  const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Nhập OTP
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gửi OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setLoading(true);
      await authAPI.sendOtp(formData.email);
      setMessage('✅ Mã OTP đã được gửi đến email của bạn.');
      setStep(2);
      startCountdown();
    } catch (err) {
      console.error(err);
      setError('Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xác minh OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const result = await authAPI.verifyOtp(
        formData.email,
        formData.password,
        formData.otp,
        formData.fullName
        );
      setMessage(result.message || '🎉 Đăng ký thành công!');
      // ✅ Chuyển sang trang đăng nhập sau 1.5s
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setError('Mã OTP không hợp lệ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Đếm ngược gửi lại OTP
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

  // Gửi lại OTP
  const resendOtp = async () => {
    if (countdown > 0) return;
    try {
      setLoading(true);
      await authAPI.sendOtp(formData.email);
      setMessage('✅ Đã gửi lại mã OTP.');
      startCountdown();
    } catch {
      setError('Gửi lại OTP thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {step === 1 ? 'Đăng ký tài khoản' : 'Nhập mã OTP'}
        </h2>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {/* Bước 1: Nhập email + mật khẩu */}
        {step === 1 && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                placeholder="Nhập họ và tên của bạn"
                value={formData.fullName || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </form>
        )}

        {/* Bước 2: Nhập mã OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Mã OTP</label>
              <input
                type="text"
                name="otp"
                placeholder="Nhập mã OTP gồm 6 số"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength="6"
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Đang xác minh...' : 'Xác nhận OTP'}
            </button>
            <button
              type="button"
              className="btn-resend"
              onClick={resendOtp}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Gửi lại OTP (${countdown}s)` : 'Gửi lại mã OTP'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {step === 1 ? (
            <>
              <span>Đã có tài khoản? </span>
              <a
                href="#"
                className="auth-link"
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </a>
            </>
          ) : (
            <>
              <span>Chưa nhận được mã? </span>
              <a href="#" className="auth-link" onClick={resendOtp}>
                Gửi lại
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
