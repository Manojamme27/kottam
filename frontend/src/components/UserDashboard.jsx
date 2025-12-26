import React, { useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import { categories } from "../category";
import CategoryCardCircle from "./CategoryCardCircle";
import { useSelector, useDispatch } from "react-redux";
import FoodCardCompact from "./FoodCardCompact";
import { useNavigate } from "react-router-dom";
import ItemModal from "./ItemModal";
import axios from "axios";
import { serverUrl } from "../App";
import {
  setShopsInMyCity,
  setItemsInMyCity,
  setSearchItems,
  setSearchShops,
} from "../redux/userSlice";

import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.png";

import { getImageUrl } from "../utils/getImageUrl";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

function UserDashboard() {
  const {
    shopInMyCity,
    itemsInMyCity,
    searchItems,
    searchShops,
    socket,
    userData,
  } = useSelector((state) => state.user);

  // ✅ SAFETY GUARDS (CRITICAL)
  const safeShops = Array.isArray(shopInMyCity) ? shopInMyCity : [];
  const safeItems = Array.isArray(itemsInMyCity) ? itemsInMyCity : [];

  const cateScrollRef = useRef();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [updatedItemsList, setUpdatedItemsList] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* ===========================
     🔥 LOAD FROM CACHE (INSTANT)
  ============================ */
  useEffect(() => {
    const cachedShops = localStorage.getItem("shops_cache");
    const cachedItems = localStorage.getItem("items_cache");

    if (cachedShops) dispatch(setShopsInMyCity(JSON.parse(cachedShops)));
    if (cachedItems) dispatch(setItemsInMyCity(JSON.parse(cachedItems)));
  }, [dispatch]);

  /* ===========================
     🔥 FILTER OPEN ITEMS
  ============================ */
  useEffect(() => {
  if (!Array.isArray(shopInMyCity)) {
    setUpdatedItemsList([]);
    return;
  }

  const allItems = shopInMyCity
    .filter(shop => shop?.isOpen !== false)
    .flatMap(shop => Array.isArray(shop.items) ? shop.items : []);

  setUpdatedItemsList(allItems);
}, [shopInMyCity]);


  /* ===========================
     🔥 FIRST FETCH (ALL + NEARBY)
  ============================ */
  useEffect(() => {
  const fetchAllData = async () => {
    try {
      const allRes = await axios.get(
        `${serverUrl}/api/shop/all`,
        { withCredentials: true }
      );

      const allShops = Array.isArray(allRes.data) ? allRes.data : [];

      // 👇 NO LOCATION FILTER HERE
      const shopsWithFlag = allShops.map(shop => ({
        ...shop,
        isNearby: false, // default
      }));

      const items = shopsWithFlag.flatMap(s => s.items || []);

      dispatch(setShopsInMyCity(shopsWithFlag));
      dispatch(setItemsInMyCity(items));

      localStorage.setItem("shops_cache", JSON.stringify(shopsWithFlag));
      localStorage.setItem("items_cache", JSON.stringify(items));
    } catch (e) {
      console.log("Fetch all shops failed", e);
    }
  };

  fetchAllData();
}, [dispatch]);

  /* ===========================
     🔥 BACKGROUND NEARBY REFRESH
  ============================ */
  useEffect(() => {
    if (!userData?.location?.coordinates) return;

    const [lng, lat] = userData.location.coordinates;

    const interval = setInterval(async () => {
      try {
        const nearRes = await axios.get(
          `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
          { withCredentials: true }
        );

        const nearbyIds = new Set((nearRes.data || []).map((s) => s._id));

        if (!Array.isArray(shopInMyCity)) return;

        const updated = shopInMyCity.map((shop) => ({
          ...shop,
          isNearby: nearbyIds.has(shop._id),
        }));

        dispatch(setShopsInMyCity(updated));
      } catch {
        // silent fail (NO UI BREAK)
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userData?.location, shopInMyCity, dispatch]);

  /* ===========================
     🔥 SOCKET REAL-TIME REFRESH
  ============================ */
  const triggerQuickRefresh = async () => {
    if (!userData?.location?.coordinates) return;
    if (!Array.isArray(shopInMyCity)) return;

    const [lng, lat] = userData.location.coordinates;

    try {
      const nearRes = await axios.get(
        `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
        { withCredentials: true }
      );

      const nearbyIds = new Set((nearRes.data || []).map((s) => s._id));

      const updated = shopInMyCity.map((shop) => ({
        ...shop,
        isNearby: nearbyIds.has(shop._id),
      }));

      dispatch(setShopsInMyCity(updated));
    } catch {
      // keep UI stable
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("shop-updated", triggerQuickRefresh);
    socket.on("item-updated", triggerQuickRefresh);
    socket.on("shop-added", triggerQuickRefresh);
    socket.on("item-deleted", triggerQuickRefresh);

    return () => {
      socket.off("shop-updated", triggerQuickRefresh);
      socket.off("item-updated", triggerQuickRefresh);
      socket.off("shop-added", triggerQuickRefresh);
      socket.off("item-deleted", triggerQuickRefresh);
    };
  }, [socket, triggerQuickRefresh]);





  // -----------------------------
  // 🔥 CATEGORY FILTER
  // -----------------------------
  const handleFilterByCategory = (category) => {
  if (!Array.isArray(itemsInMyCity)) return;

  if (!category || category === "All") {
    setUpdatedItemsList(itemsInMyCity);
  } else {
    setUpdatedItemsList(
      itemsInMyCity.filter(i => i.category === category)
    );
  }
};


  return (
    <div className="w-screen min-h-screen flex flex-col bg-[#fff9f6]">
      <Nav />

      <div className="relative">
        {/* SLIDER BANNERS */}
        <div className="w-full flex justify-center relative z-0 -mt-3.5 sm:-mt-4 md:-mt-[18px] lg:-mt-5">
          <div className="w-full max-w-6xl">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
              }}
              className="rounded-none sm:rounded-2xl overflow-hidden"
            >
              {[banner1, banner2, banner3, banner4].map((banner, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={banner}
                    alt={`Banner ${i + 1}`}
                    className="w-full h-60 sm:h-[230px] md:h-[300px] lg:h-[330px] object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* SEARCH RESULTS */}
        {searchItems && searchItems.length > 0 && (
          <div className="search-results w-full max-w-6xl mx-auto bg-white shadow-md rounded-2xl mt-4 p-5">

            <h1 className="text-[#2b2b2b] text-lg sm:text-xl font-semibold uppercase tracking-widest border-b border-gray-200 pb-2">
              SEARCH RESULTS
            </h1>

            <div
              className="grid gap-4 sm:gap-5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              }}
            >
              {searchItems.map((item) => (
                <FoodCardCompact
  key={item._id}
  data={item}
  onClick={(item) => {
    setModalItem(item);
  }}
/>

              ))}
            </div>
          </div>
        )}
        {searchShops && searchShops.length > 0 && (
  <div className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-2xl mt-4 p-5">
    <h1 className="text-[#2b2b2b] text-lg sm:text-xl font-semibold uppercase tracking-widest border-b border-gray-200 pb-2">
      SHOPS
    </h1>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {searchShops.map((shop) => (
        <div
  key={shop._id}
  onClick={() => navigate(`/shop/${shop._id}`)}
  className="shop-card cursor-pointer bg-white rounded-xl border p-3 hover:shadow-md transition"
>

          <img
            src={shop.images?.[0] || shop.image}
            alt={shop.name}
            className="w-full h-32 object-cover rounded-lg"
          />
          <p className="mt-2 font-semibold text-gray-800 truncate">
            {shop.name}
          </p>
        </div>
      ))}
    </div>
  </div>
)}


        {/* CATEGORIES */}
        <div className="w-full max-w-6xl mx-auto px-2.5 sticky top-[72px] z-40 bg-[#fff9f6] py-3">
          <h2 className="text-gray-700 text-base sm:text-lg font-semibold uppercase tracking-[0.15em] mb-3 sm:mb-4">
            Categories
          </h2>

          <div
            ref={cateScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 no-scrollbar"
          >
            {categories.map((cate, idx) => (
              <CategoryCardCircle
                key={idx}
                name={cate.category}
                image={cate.image}
                isSelected={selectedCategory === cate.category}
                onClick={() => {
                  setSelectedCategory(cate.category);
                  handleFilterByCategory(cate.category);
                }}
              />
            ))}
          </div>
        </div>

        {/* Recommended Items */}
        <div className="w-full max-w-6xl mx-auto px-3 mt-6">
          <h2 className="text-gray-700 text-base sm:text-lg font-semibold uppercase tracking-[0.15em] mb-3 sm:mb-4">
            Recommended For You
          </h2>

          <div className="relative">
            <div
              className="overflow-x-auto no-scrollbar pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div
                style={{
                  display: "grid",
                  gridAutoFlow: "column",
                  gridTemplateRows: "repeat(2, auto)",
                  gridAutoColumns: "minmax(140px, 170px)",
                  gap: "10px 10px",
                  padding: "3px",
                  alignItems: "start",
                }}
              >
                {Array.isArray(updatedItemsList) &&
  updatedItemsList.map((item, idx) => (
    <div key={item._id || idx} className="flex justify-center">
      <div className="w-full max-w-[170px]">
        <FoodCardCompact
          data={item}
          onClick={(item) => {
            dispatch(setSearchItems(null));
            dispatch(setSearchShops(null));
            setModalItem(item);
          }}
        />
      </div>
    </div>
  ))}

              </div>
            </div>
          </div>
        </div>

        {/* Best Shops */}
        <div className="w-full max-w-6xl mx-auto px-3 mt-10 mb-12">
          <h2 className="text-gray-700 text-base sm:text-lg font-semibold uppercase tracking-[0.15em] mb-3 sm:mb-4">
            Best Shops Near You

          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shopInMyCity
              ?.filter((shop) => shop.isOpen !== false)
              .map((shop) => (
                <div
                  key={shop._id}
                  onClick={() => navigate(`/shop/${shop._id}`)}
                  className="cursor-pointer bg-white rounded-2xl border border-[#ff4d2d]/20 shadow-sm hover:shadow-md transition-transform duration-300 hover:scale-[1.01] overflow-hidden"
                >
                  <div className="relative w-full h-52 sm:h-60 md:h-64">
                    <Swiper
                      modules={[Autoplay, Pagination]}
                      loop={true}
                      autoplay={{ delay: 2000 }}
                      pagination={{ clickable: true }}
                      className="w-full h-full"
                    >
                      {(shop.images?.length ? shop.images : [shop.image]).map(
                        (img, idx) => (
                          <SwiperSlide key={idx}>
                            <img
                              src={getImageUrl(img)}
                              alt={`${shop.name}-${idx}`}
                              className="w-full h-full object-cover"
                            />
                          </SwiperSlide>
                        )
                      )}
                    </Swiper>
                  </div>

                  <div className="p-4">
                    <h3 className="text-gray-900 font-semibold text-lg truncate">
                      {shop.name}
                    </h3>

                    <div className="mt-3 text-sm font-medium text-gray-600">
                      Customer Favourite 🌟
                    </div>

                    <span className="text-green-600 font-semibold text-sm bg-green-100 px-2 py-0.5 rounded-lg">
                      ★ 4.{Math.floor(Math.random() * 5)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      By {Math.floor(Math.random() * 9) + 1}.9k+
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {modalItem && (
  <ItemModal
  item={modalItem}
  onClose={() => setModalItem(null)}
/>

)}

    </div>
  );
}

export default UserDashboard;






