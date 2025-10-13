

import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../Service/profileService';
// import './ProfileInfo.css'; // Nếu cần CSS riêng

const ProfileInfo = () => {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {

    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profile);
      alert('Cập nhật thông tin thành công!');
      setIsEditing(false);
    
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      alert('Cập nhật thất bại.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tên:</label>
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          disabled={!isEditing}
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={profile.email}
          disabled 
        />
      </div>
      
      {!isEditing ? (
        <button type="button" onClick={() => setIsEditing(true)}>Chỉnh Sửa</button>
      ) : (
        <>
          <button type="submit">Lưu Thay Đổi</button>
          <button type="button" onClick={() => setIsEditing(false)}>Hủy</button>
        </>
      )}
    </form>
  );
};

export default ProfileInfo;