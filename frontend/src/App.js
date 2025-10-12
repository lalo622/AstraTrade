import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import AdminPage from "./Pages/AdminPage";
import RegisterForm from "./Component/Common/Register";
import LoginForm from "./Component/Common/Login";
import { AuthProvider, useAuth } from './Context/AuthContext';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </div>
      </AuthProvider>
    </Router>
  );
}

export default App;