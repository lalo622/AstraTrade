import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Bot, User } from 'lucide-react';
import axios from 'axios';

const ChatbotPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là trợ lý ảo của AstraTrade. Tôi có thể giúp gì cho bạn?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Tìm sản phẩm',
    'Đăng tin mới',
    'Hướng dẫn sử dụng',
    'Liên hệ hỗ trợ'
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE = 'http://localhost:5234/api/chatbot';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/suggestions`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || newMessage.trim();
    
    if (!textToSend || loading) return;

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/message`, {
        message: textToSend
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.reply,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, tôi không thể trả lời ngay bây giờ. Vui lòng thử lại sau!',
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 p-2 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Trợ lý ảo AstraTrade</p>
              <p className="text-sm text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Đang hoạt động
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'} animate-fadeIn`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md`}>
                {msg.isBot && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    msg.isBot
                      ? 'bg-white text-gray-900 rounded-bl-none shadow-md border border-gray-100'
                      : 'bg-blue-600 text-white rounded-br-none shadow-md'
                  }`}
                >
                  <p className="break-words whitespace-pre-line">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>

                {!msg.isBot && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex items-end space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">Gợi ý câu hỏi:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition shadow-md"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      <style >{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatbotPage;