import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, User as UserIcon, Image as ImageIcon, X } from 'lucide-react';
import * as signalR from '@microsoft/signalr';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  //  States cho upload ảnh
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Khởi tạo SignalR connection
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5234/chatHub?userId=${user.id}`)
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        if (isMounted) {
          console.log(' SignalR Connected - UserID:', user.id);
          connectionRef.current = connection;
        }
      } catch (err) {
        if (isMounted) {
          console.error(' SignalR Error:', err);
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().then(() => {
          console.log('🔌 SignalR Disconnected');
        });
      }
    };
  }, [user]);

  // Lắng nghe tin nhắn mới
  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection) return;

    const handleReceiveMessage = (message) => {
      console.log(' New message received:', message);
      
      const isMessageForMe = 
        message.receiverID === user?.id || 
        message.senderID === user?.id;
      
      if (!isMessageForMe) {
        console.log(' Message not for me, ignoring');
        return;
      }
      
      if (selectedUser && 
          (message.senderID === selectedUser.userId || 
           message.receiverID === selectedUser.userId)) {
        console.log(' Adding message to current chat');
        setMessages(prev => {
          const exists = prev.some(m => m.chatID === message.chatID);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      
      fetchConversations();
    };

    connection.on('ReceiveMessage', handleReceiveMessage);

    return () => {
      connection.off('ReceiveMessage', handleReceiveMessage);
    };
  }, [user, selectedUser]);

  // Lấy danh sách conversations
  const fetchConversations = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:5234/api/chat/conversations?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy tin nhắn với 1 user
  const fetchMessages = async (otherUserId) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:5234/api/chat/messages/${otherUserId}?currentUserId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  //  Xử lý chọn ảnh
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!');
        return;
      }

      // Kiểm tra kích thước (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ảnh không được vượt quá 5MB!');
        return;
      }

      setSelectedImage(file);
      
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  //  Hủy chọn ảnh
  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  //  Upload ảnh lên server
  const uploadImage = async () => {
    if (!selectedImage) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const response = await fetch('http://localhost:5234/api/chat/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.imageUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Không thể upload ảnh. Vui lòng thử lại!');
      return null;
    } finally {
      setUploading(false);
    }
  };

  //  Gửi tin nhắn (có thể kèm ảnh)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Kiểm tra có message hoặc ảnh
    if ((!newMessage.trim() && !selectedImage) || !selectedUser || sending) return;

    setSending(true);
    
    try {
      let imageUrl = null;

      // Upload ảnh nếu có
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setSending(false);
          return;
        }
      }

      // Gửi tin nhắn
      const response = await fetch('http://localhost:5234/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          senderID: user.id,
          receiverID: selectedUser.userId,
          message: newMessage.trim() || '📷 Hình ảnh',
          imageUrl: imageUrl
        })
      });

      if (response.ok) {
        setNewMessage('');
        handleCancelImage(); // Xóa ảnh preview
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations khi mount
  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Xử lý chat từ PostDetail
  useEffect(() => {
    if (location.state?.chatWithUser) {
      const userToChat = location.state.chatWithUser;
      setSelectedUser(userToChat);
      fetchMessages(userToChat.userId);
    }
  }, [location.state]);

  // Chọn conversation
  const handleSelectConversation = (conv) => {
    setSelectedUser({
      userId: conv.userId,
      username: conv.username
    });
    fetchMessages(conv.userId);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">Vui lòng đăng nhập để sử dụng chat</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    if (date.toDateString() === now.toDateString()) {
      return timeStr;
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return `${timeStr} Hôm qua`;
    }
    
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return `${timeStr} ${days[date.getDay()]}`;
    }
    
    return `${timeStr} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.dateTime).toDateString();
    const prevDate = new Date(prevMsg.dateTime).toDateString();
    
    return currentDate !== prevDate;
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Hôm nay';
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[date.getDay()]}, ${date.getDate()} tháng ${date.getMonth() + 1}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Danh sách conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="hover:bg-blue-700 p-2 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">Tin nhắn</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
              <UserIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-center">Chưa có cuộc hội thoại nào</p>
              <p className="text-sm text-center mt-2">Bắt đầu chat từ trang chi tiết tin đăng</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => handleSelectConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedUser?.userId === conv.userId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {conv.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{conv.username}</p>
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(conv.lastMessageTime)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedUser.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.username}</p>
                  <p className="text-sm text-green-600">● Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => {
                const isMe = msg.senderID === user.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                
                return (
                  <React.Fragment key={msg.chatID}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-6">
                        <div className="bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
                          {formatDateSeparator(msg.dateTime)}
                        </div>
                      </div>
                    )}
                    
                    {/* Message */}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none shadow'
                        }`}
                      >
                        {/*  Hiển thị ảnh nếu có */}
                        {msg.imageUrl && (
                          <div className="p-2">
                            <img
                              src={msg.imageUrl}
                              alt="Sent image"
                              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                          </div>
                        )}
                        
                        {/* Text message */}
                        {msg.message && msg.message !== '📷 Hình ảnh' && (
                          <div className="px-4 py-2">
                            <p className="break-words">{msg.message}</p>
                          </div>
                        )}
                        
                        {/* Time */}
                        <div className="px-4 pb-2">
                          <p className={`text-xs ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTime(msg.dateTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ✅ Image Preview */}
            {imagePreview && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={handleCancelImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                {/* ✅ Button chọn ảnh */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-200 text-gray-700 p-3 rounded-full hover:bg-gray-300 transition"
                  disabled={sending || uploading}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                  disabled={sending || uploading}
                />
                
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedImage) || sending || uploading}
                  className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {sending || uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <UserIcon className="w-24 h-24 mx-auto mb-4 text-gray-300" />
              <p className="text-xl">Chọn một cuộc hội thoại để bắt đầu chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;