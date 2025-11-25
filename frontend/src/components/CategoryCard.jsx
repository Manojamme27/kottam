import React from "react";

function CategoryCard({ name, image, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-start cursor-pointer transition-transform hover:scale-105"
    >
      <div className="relative w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full overflow-hidden border-2 border-[#ff4d2d] shadow-sm bg-white">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-full transition-transform duration-300 hover:scale-110"
        />
      </div>

      {/* Category Name */}
      <p className="mt-2 text-[12px] sm:text-sm md:text-[15px] font-medium text-gray-800 tracking-wide text-center capitalize">
        {name}
      </p>
    </div>
  );
}

export default CategoryCard;
