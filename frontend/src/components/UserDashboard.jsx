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
  setSearchShops
} from "../redux/userSlice";

// banners
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.png";

import { getImageUrl } from "../utils/getImageUrl";

// swiper
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
    userData
  } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cateScrollRef = useRef();

  const [updatedItemsList, setUpdatedItemsList] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* =====================================================
     🔥 INSTANT LOAD FROM CACHE
  ===================================================== */
  useEffect(() => {
    try {
      const shops = localStorage.getItem("shops_cache");
      const items = localStorage.getItem("items_cache");

      if (shops) dispatch(setShopsInMyCity(JSON.parse(shops)));
      if (items) dispatch(setItemsInMyCity(JSON.parse(items)));
    } catch {}
  }, [dispatch]);

  /* =====================================================
     🔥 FILTER OPEN ITEMS
  ===================================================== */
  useEffect(() => {
    if (!Array.isArray(itemsInMyCity)) {
      setUpdatedItemsList([]);
      return;
    }

    setUpdatedItemsList(
      itemsInMyCity.filter(item => item.shop?.isOpen !== false)
    );
  }, [itemsInMyCity]);

  /* =====================================================
     🔥 FIRST FULL FETCH (ALL + NEARBY TAG)
  ===================================================== */
  useEffect(() => {
    if (!userData?.location?.coordinates?.length) return;

    const [lng, lat] = userData.location.coordinates;

    const fetchAll = async () => {
      try {
        const [allRes, nearRes] = await Promise.all([
          axios.get(`${serverUrl}/api/shop/all`, { withCredentials: true }),
          axios.get(
            `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
            { withCredentials: true }
          )
        ]);

        const allShops = Array.isArray(allRes.data) ? allRes.data : [];
        const nearbyIds = new Set((nearRes.data || []).map(s => s._id));

        const merged = allShops.map(shop => ({
          ...shop,
          isNearby: nearbyIds.has(shop._id),
        }));

        const items = merged.flatMap(s => s.items || []);

        dispatch(setShopsInMyCity(merged));
        dispatch(setItemsInMyCity(items));

        localStorage.setItem("shops_cache", JSON.stringify(merged));
        localStorage.setItem("items_cache", JSON.stringify(items));
      } catch (e) {
        console.log("Initial fetch error:", e);
      }
    };

    fetchAll();
  }, [userData?.location, dispatch]);

  /* =====================================================
     🔥 BACKGROUND REFRESH (NEARBY ONLY – SAFE)
  ===================================================== */
  useEffect(() => {
    if (!userData?.location?.coordinates?.length) return;

    const [lng, lat] = userData.location.coordinates;

    const interval = setInterval(async () => {
      try {
        const nearRes = await axios.get(
          `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
          { withCredentials: true }
        );

        const nearbyIds = new Set((nearRes.data || []).map(s => s._id));

        dispatch(setShopsInMyCity(prev =>
          Array.isArray(prev)
            ? prev.map(shop => ({
                ...shop,
                isNearby: nearbyIds.has(shop._id),
              }))
            : prev
        ));
      } catch {}
    }, 15000);

    return () => clearInterval(interval);
  }, [userData?.location, dispatch]);

  /* =====================================================
     🔥 SAFE SOCKET REFRESH
  ===================================================== */
  const triggerQuickRefresh = async () => {
    if (!userData?.location?.coordinates?.length) return;

    const [lng, lat] = userData.location.coordinates;

    try {
      const nearRes = await axios.get(
        `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
        { withCredentials: true }
      );

      const nearbyIds = new Set((nearRes.data || []).map(s => s._id));

      dispatch(setShopsInMyCity(prev =>
        Array.isArray(prev)
          ? prev.map(shop => ({
              ...shop,
              isNearby: nearbyIds.has(shop._id),
            }))
          : prev
      ));
    } catch {}
  };

  useEffect(() => {
    if (!socket || !userData?.location?.coordinates) return;

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
  }, [socket, userData?.location]);

  /* =====================================================
     🔥 CATEGORY FILTER
  ===================================================== */
  const handleFilterByCategory = (category) => {
    if (!Array.isArray(itemsInMyCity)) return;

    const openItems = itemsInMyCity.filter(
      item => item.shop?.isOpen !== false
    );

    setUpdatedItemsList(
      category === "All"
        ? openItems
        : openItems.filter(i => i.category === category)
    );
  };

  /* =====================================================
     🔥 UI (UNCHANGED)
  ===================================================== */
  return (
    <div className="w-screen min-h-screen flex flex-col bg-[#fff9f6]">
      <Nav />

      <div className="relative">
        {/* BANNERS */}
        <div className="w-full flex justify-center relative z-0 -mt-4">
          <div className="w-full max-w-6xl">
            <Swiper
              modules={[Autoplay, Pagination]}
              loop
              autoplay={{ delay: 2500 }}
              pagination={{ clickable: true }}
            >
              {[banner1, banner2, banner3, banner4].map((b, i) => (
                <SwiperSlide key={i}>
                  <img src={b} className="w-full h-64 object-cover" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="w-full max-w-6xl mx-auto px-3 mt-4">
          <div ref={cateScrollRef} className="flex gap-4 overflow-x-auto">
            {categories.map((c, i) => (
              <CategoryCardCircle
                key={i}
                name={c.category}
                image={c.image}
                isSelected={selectedCategory === c.category}
                onClick={() => {
                  setSelectedCategory(c.category);
                  handleFilterByCategory(c.category);
                }}
              />
            ))}
          </div>
        </div>

        {/* RECOMMENDED */}
        <div className="w-full max-w-6xl mx-auto px-3 mt-6">
          <div className="flex gap-3 overflow-x-auto">
            {updatedItemsList.map(item => (
              <FoodCardCompact
                key={item._id}
                data={item}
                onClick={() => {
                  dispatch(setSearchItems(null));
                  dispatch(setSearchShops(null));
                  setModalItem(item);
                }}
              />
            ))}
          </div>
        </div>

        {/* SHOPS */}
        <div className="w-full max-w-6xl mx-auto px-3 mt-10 mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shopInMyCity?.filter(s => s.isOpen !== false).map(shop => (
            <div
              key={shop._id}
              onClick={() => navigate(`/shop/${shop._id}`)}
              className="cursor-pointer bg-white rounded-xl shadow"
            >
              <Swiper autoplay loop>
                {(shop.images?.length ? shop.images : [shop.image]).map((img, i) => (
                  <SwiperSlide key={i}>
                    <img src={getImageUrl(img)} className="w-full h-56 object-cover" />
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="p-4 font-semibold">{shop.name}</div>
            </div>
          ))}
        </div>
      </div>

      {modalItem && (
        <ItemModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}

export default UserDashboard;
