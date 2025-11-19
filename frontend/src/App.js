import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import AdminPage from "./Pages/AdminPage";
import Auth from "./Pages/Auth";
import RegisterForm from "./Pages/Register";
import LoginForm from "./Pages/Login";
import PostAd from "./Pages/Postad";
import UserProfile from './Pages/UserProfile';
import ProtectedRoute from "./Pages/ProtectedRoute"; 
import { AuthProvider } from './Context/AuthContext';
import MainLayout from "./Component/Common/MainLayout"; 
import FavoritePage from "./Pages/FavoritePage";
import ForgotPassword from "./Pages/ForgotPassword";
import PaymentSuccess from './Pages/PaymentSuccess';
import PaymentFailed from './Pages/PaymentFailed';
import PaymentHistory from './Pages/PaymentHistory';
import UserAdsManagement from "./Pages/MyAdvertisement";
import PackageSelection from "./Pages/PackageSelection";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import PostDetail from "./Pages/PostDetail";
import AdminVipPackagePage from './Component/Admin/AdminVipPackagePage/AdminVipPackagePage';
import AdminCategoryList from './Component/Admin/Category/AdminCategoryList';
import AdminModerationPage from './Component/Admin/AdModeration/AdminModerationPage';
import AdminLayout from "./Component/Admin/AdminLayout";
import ChatPage from "./Pages/ChatPage";
import AdminReportList from "./Component/Report/AdminReportList";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* === TRANG KHÁCH - BỌC TRONG MAINLAYOUT === */}
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/favorites" element={<MainLayout><FavoritePage /></MainLayout>} />
            <Route path="/post/:id" element={<MainLayout><PostDetail /></MainLayout>} />
            
            {/* === TRANG CẦN ĐĂNG NHẬP - BỌC TRONG MAINLAYOUT === */}
            <Route 
              path="/postad" 
              element={
                <ProtectedRoute>
                  <MainLayout><PostAd /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-ads" 
              element={
                <ProtectedRoute>
                  <MainLayout><UserAdsManagement /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <MainLayout><UserProfile /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/packages" 
              element={
                <ProtectedRoute>
                  <MainLayout><PackageSelection /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/history" 
              element={
                <ProtectedRoute>
                  <MainLayout><PaymentHistory /></MainLayout>
                </ProtectedRoute>
              } 
              
            />
             <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <MainLayout><ChatPage /></MainLayout>
                </ProtectedRoute>
              } 
              
            />

            {/* === TRANG ADMIN - BỌC TRONG ADMINLAYOUT === */}
            <Route path="/admin" element={<AdminPage />} />
            
            <Route 
              path="/admin/vip-packages" 
              element={
                <ProtectedRoute>
                  <AdminLayout><AdminVipPackagePage /></AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/categories" 
              element={
                <ProtectedRoute>
                  <AdminLayout><AdminCategoryList /></AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/moderation" 
              element={
                <ProtectedRoute>
                  <AdminLayout><AdminModerationPage /></AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute>
                  <AdminLayout><AdminReportList /></AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;