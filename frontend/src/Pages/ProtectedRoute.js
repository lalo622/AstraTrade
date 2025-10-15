import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    // Chưa đăng nhập, chuyển hướng đến trang login
    return <Navigate to="/login" replace />;
  }
  
  // Đã đăng nhập, hiển thị component
  return children;
};

export default ProtectedRoute;