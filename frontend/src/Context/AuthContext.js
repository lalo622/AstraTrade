import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId'); 
    
    console.log('🔍 AuthContext - Loading from localStorage:', {
      token: token ? 'exists' : 'null',
      userEmail,
      username,
      userId
    });
    
    if (token && userEmail && userId) {
      const userData = { 
        id: parseInt(userId), 
        email: userEmail, 
        token,
        username: username || userEmail.split('@')[0] 
      };
      
      console.log('✅ User restored from localStorage:', userData);
      setUser(userData);
    } else {
      console.log('❌ Missing data in localStorage, user not restored');
    }
    
    setLoading(false);
  }, []);

  const login = (userData) => {
    console.log("🔄 Login function called with:", userData);
    
    // ✅ Xử lý cả 2 trường hợp: id hoặc userId
    const userId = userData.id || userData.userId || userData.userID;
    
    if (!userId) {
      console.error('❌ ERROR: No user ID found in userData!', userData);
      return;
    }
    
    const userWithId = {
      id: userId,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      token: userData.token
    };
    
    console.log("💾 Saving user data:", userWithId);
    
    setUser(userWithId);
    
    // ✅ Lưu vào localStorage
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('username', userWithId.username);
    localStorage.setItem('userId', userId.toString());
    
    console.log("✅ Saved to localStorage:", {
      token: localStorage.getItem('token') ? 'saved' : 'failed',
      userId: localStorage.getItem('userId'),
      userEmail: localStorage.getItem('userEmail'),
      username: localStorage.getItem('username')
    });
  };

  const logout = () => {
    console.log("🚪 Logging out...");
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    console.log("✅ Logout complete, localStorage cleared");
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};