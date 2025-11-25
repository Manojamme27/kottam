import React from "react";
import Slider from "react-slick";
import { FaStore } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

const ShopBannerSlider = ({ images, shop }) => {
    if (!images || images.length === 0) return null;

    const settings = {
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 2800,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        speed: 700,
        pauseOnHover: false,
        cssEase: "ease-in-out"
    };

    return (
        <div className="relative w-full h-64 md:h-80 lg:h-96">
            <Slider {...settings}>
                {images.map((img, idx) => (
                    <div key={idx}>
                        <img
                            src={img}
                            alt="Shop Banner"
                            className="w-full h-64 md:h-80 lg:h-96 object-cover"
                        />
                    </div>
                ))}
            </Slider>

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-black/60 to-black/20 flex flex-col justify-center items-center text-center px-4">
                <FaStore className="text-white text-4xl mb-3 drop-shadow-md" />
                <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                    {shop?.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <FaLocationDot size={18} color="red" />
                    <p className="text-base md:text-lg text-gray-200">{shop?.address}</p>
                </div>
            </div>
        </div>
    );
};

export default ShopBannerSlider;
