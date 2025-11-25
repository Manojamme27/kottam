import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.png";

const HeadlineBanner = () => {
    const banners = [banner1, banner2, banner3, banner4];

    return (
        <div className="w-full max-w-6xl mx-auto mt-3 rounded-2xl overflow-hidden">
            <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                loop={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    bulletClass: "swiper-pagination-bullet bg-[#ff4d2d]",
                }}
                className="rounded-2xl"
            >
                {banners.map((banner, index) => (
                    <SwiperSlide key={index}>
                        <img
                            src={banner}
                            alt={`banner-${index + 1}`}
                            className="w-full h-52 sm:h-64 md:h-72 lg:h-80 object-cover rounded-2xl shadow-md"
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default HeadlineBanner;
