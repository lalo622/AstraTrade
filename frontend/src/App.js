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
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import PostDetail from "./Pages/PostDetail";
import AdminVipPackagePage from './Component/Admin/AdminVipPackagePage/AdminVipPackagePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Trang có MainLayout */}
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route 
              path="/postad" 
              element={
                <ProtectedRoute>
                  <MainLayout><PostAd /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="/favorites" element={<MainLayout><FavoritePage /></MainLayout>} />
            <Route path="/post/:id" element={<MainLayout><PostDetail /></MainLayout>} />

           
            <Route path="/admin" element={<AdminPage />} />

            
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<UserProfile />} />

            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/payment/history" element={<PaymentHistory />} />
             <Route path="/admin/vip-packages" element={<AdminVipPackagePage />} />
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