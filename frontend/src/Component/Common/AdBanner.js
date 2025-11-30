import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const AdBanner = ({ position = 'sidebar' }) => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [closedAds, setClosedAds] = useState([]);

  useEffect(() => {
    fetchActiveAds();
  }, []);

  // Tự động chuyển quảng cáo sau mỗi 5 giây
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [ads]);

  const fetchActiveAds = async () => {
    try {
      const response = await axios.get('http://localhost:5234/api/admin/ads');
      const activeAds = response.data.filter(ad => ad.isActive);
      setAds(activeAds);
    } catch (error) {
      console.error('Lỗi khi tải quảng cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (targetUrl) => {
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCloseAd = (adId) => {
    setClosedAds([...closedAds, adId]);
  };

  if (loading) {
    return (
      <div className={`${position === 'sidebar' ? 'w-full' : 'w-full max-w-4xl mx-auto'} bg-gray-100 rounded-2xl animate-pulse`}>
        <div className={`${position === 'sidebar' ? 'h-96' : 'h-32'} bg-gray-200`}></div>
      </div>
    );
  }

  const visibleAds = ads.filter(ad => !closedAds.includes(ad.adID));

  if (visibleAds.length === 0) {
    return null;
  }

  const currentAd = visibleAds[currentAdIndex % visibleAds.length];

  // Render cho sidebar (bên phải)
  if (position === 'sidebar') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Quảng cáo
        </h3>
        
        {visibleAds.map((ad, index) => (
          <div
            key={ad.adID}
            className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer ${
              index === currentAdIndex ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => handleAdClick(ad.targetUrl)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseAd(ad.adID);
              }}
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative">
              <img
                src={`http://localhost:5234${ad.imageUrl}`}
                alt={ad.name}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/300x400?text=Ad+Banner';
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm font-semibold">{ad.name}</p>
                <p className="text-xs opacity-90 mt-1">Nhấn để xem chi tiết →</p>
              </div>
            </div>
          </div>
        ))}

        {visibleAds.length > 1 && (
          <div className="flex gap-2 justify-center">
            {visibleAds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentAdIndex
                    ? 'w-8 bg-orange-500'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render cho banner ngang (top/bottom)
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCloseAd(currentAd.adID);
        }}
        className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={() => handleAdClick(currentAd.targetUrl)}
        className="relative h-32 sm:h-40"
      >
        <img
          src={`http://localhost:5234${currentAd.imageUrl}`}
          alt={currentAd.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/1200x200?text=Ad+Banner';
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <p className="text-lg font-bold drop-shadow-lg">{currentAd.name}</p>
            <p className="text-sm opacity-90 mt-1">Nhấn để xem chi tiết →</p>
          </div>
        </div>
      </div>

      {visibleAds.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
          {visibleAds.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentAdIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentAdIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        Quảng cáo
      </div>
    </div>
  );
};

export default AdBanner;