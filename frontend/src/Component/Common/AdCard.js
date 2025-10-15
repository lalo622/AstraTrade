import React from "react";

const AdCard = ({ ad, onRemove }) => {
  return (
    <div className="border rounded-lg shadow-md p-3 bg-white flex flex-col">
      <img
        src={ad.image || "https://via.placeholder.com/200"}
        alt={ad.title}
        className="rounded-md h-40 w-full object-cover mb-2"
      />
      <h3 className="font-semibold text-lg">{ad.title}</h3>
      <p className="text-gray-600">{ad.price?.toLocaleString()} VND</p>

      {onRemove && (
        <button
          onClick={() => onRemove(ad.advertisementID)}
          className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Xóa khỏi yêu thích
        </button>
      )}
    </div>
  );
};

export default AdCard;
