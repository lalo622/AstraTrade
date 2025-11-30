import React, { useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleClick = (star) => {
    if (!readonly) {
      onRatingChange(star);
    }
  };

  const handleMouseEnter = (star) => {
    if (!readonly) {
      setHoveredStar(star);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredStar(0);
    }
  };

  const getStarColor = (star) => {
    const currentRating = hoveredStar || rating;
    if (star <= currentRating) {
      return "fill-yellow-400 text-yellow-400";
    }
    return "text-gray-300";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`transition-all transform ${
              !readonly ? "hover:scale-125 cursor-pointer" : "cursor-default"
            } ${hoveredStar === star ? "scale-110" : ""}`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${getStarColor(star)}`}
            />
          </button>
        ))}
      </div>
      
      {!readonly && rating > 0 && (
        <span className="text-sm font-medium text-gray-700 ml-2">
          {rating === 1 && "Rất tệ"}
          {rating === 2 && "Tệ"}
          {rating === 3 && "Bình thường"}
          {rating === 4 && "Tốt"}
          {rating === 5 && "Xuất sắc"}
        </span>
      )}
    </div>
  );
};

export default StarRating;