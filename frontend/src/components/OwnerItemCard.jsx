import axios from "axios";
import React from "react";
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

function OwnerItemCard({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      const result = await axios.delete(`${serverUrl}/api/item/delete/${data._id}`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
    } catch (error) {
      console.log(error);
    }
  };

  const discount =
    data.offerPrice && data.price
      ? Math.round(((data.price - data.offerPrice) / data.price) * 100)
      : 0;

  const thumbnail = data.images?.[0] || "/no-image.png";

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg border border-[#ff4d2d]/30 overflow-hidden transition-all duration-300 hover:scale-[1.02] w-[260px] sm:w-[280px]">

      {/* Image Section */}
      <div className="relative h-40 w-full bg-gray-50">
        <img
          src={thumbnail}
          alt={data.name}
          className="w-full h-full object-cover"
        />

        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-[#ff4d2d] text-white text-xs font-semibold px-2 py-0.5 rounded-md shadow-sm">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col grow p-4">
        <h2 className="text-lg font-semibold text-[#ff4d2d] leading-snug">
          {data.name}
        </h2>

        {data.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        <p className="text-sm text-gray-700 mt-2">
          <span className="font-semibold">Category:</span> {data.category}
        </p>

        <p className="text-sm text-gray-700">
          <span className="font-semibold">Type:</span> {data.foodType}
        </p>
      </div>

      {/* Price + Actions */}
      <div className="border-t border-gray-100 mt-auto px-4 py-3 flex items-center justify-between">
        {/* Price */}
        <div className="flex flex-col">
          {data.offerPrice > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#ff4d2d]">
                ₹{data.offerPrice}
              </span>
              <span className="line-through text-gray-400 text-sm">
                ₹{data.price}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-[#ff4d2d]">₹{data.price}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/edit-item/${data._id}`)}
            className="p-2 rounded-full hover:bg-[#ff4d2d]/10 text-[#ff4d2d] transition"
          >
            <FaPen size={15} />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-[#ff4d2d]/10 text-[#ff4d2d] transition"
          >
            <FaTrashAlt size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerItemCard;

