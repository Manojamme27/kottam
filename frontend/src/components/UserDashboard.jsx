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
import { setShopsInMyCity, setItemsInMyCity } from "../redux/userSlice";

// banner images
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.png";

// fix image
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
    userData,
  } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cateScrollRef = useRef();

  const [updatedItemsList, setUpdatedItemsList] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const hasLoadedOnce = useRef(false);

  // --------------------------------------------------
  // FILTER OPEN SHOP ITEMS
  // --------------------------------------------------
  useEffect(() => {
    if (!Array.isArray(itemsInMyCity)) return;

    setUpdatedItemsList(
      itemsInMyCity.filter((i) => i.shop?.isOpen !== false)
    );
  }, [itemsInMyCity]);

  // --------------------------------------------------
  // INITIAL + GEO FETCH
  // --------------------------------------------------
  useEffect(() => {
    if (
      !userData?.location ||
      !Array.isArray(userData.location.coordinates) ||
      userData.location.coordinates.length !== 2
    )
      return;

    const [lng, lat] = userData.location.coordinates;

    const fetchNearby = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
          { withCredentials: true }
        );

        if (Array.isArray(res.data) && res.data.length > 0) {
          hasLoadedOnce.current = true;
          dispatch(setShopsInMyCity(res.data));

          const items = res.data.flatMap((s) =>
            Array.isArray(s.items) ? s.items : []
          );

          if (items.length > 0) {
            dispatch(setItemsInMyCity(items));
          }
        }
      } catch {
        // ❌ do nothing → keep previous UI
      }
    };

    fetchNearby();
  }, [userData?.location]);

  // --------------------------------------------------
  // BACKGROUND REFRESH (SAFE)
  // --------------------------------------------------
  useEffect(() => {
    if (
      !userData?.location ||
      !Array.isArray(userData.location.coordinates)
    )
      return;

    const [lng, lat] = userData.location.coordinates;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
          { withCredentials: true }
        );

        if (Array.isArray(res.data) && res.data.length > 0) {
          dispatch(setShopsInMyCity(res.data));
          dispatch(
            setItemsInMyCity(
              res.data.flatMap((s) => s.items || [])
            )
          );
        }
      } catch {
        // ❌ never clear UI
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userData?.location]);

  // --------------------------------------------------
  // SOCKET SAFE REFRESH
  // --------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const safeRefresh = async () => {
      if (
        !userData?.location ||
        !Array.isArray(userData.location.coordinates)
      )
        return;

      const [lng, lat] = userData.location.coordinates;

      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/nearby?latitude=${lat}&longitude=${lng}`,
          { withCredentials: true }
        );

        if (Array.isArray(res.data) && res.data.length > 0) {
          dispatch(setShopsInMyCity(res.data));
          dispatch(
            setItemsInMyCity(
              res.data.flatMap((s) => s.items || [])
            )
          );
        }
      } catch {}
    };

    socket.on("shop-updated", safeRefresh);
    socket.on("item-updated", safeRefresh);
    socket.on("shop-added", safeRefresh);
    socket.on("item-deleted", safeRefresh);

    return () => {
      socket.off("shop-updated", safeRefresh);
      socket.off("item-updated", safeRefresh);
      socket.off("shop-added", safeRefresh);
      socket.off("item-deleted", safeRefresh);
    };
  }, [socket, userData?.location]);

  // --------------------------------------------------
  // CATEGORY FILTER
  // --------------------------------------------------
  const handleFilterByCategory = (category) => {
    if (!Array.isArray(itemsInMyCity)) return;

    const openItems = itemsInMyCity.filter(
      (i) => i.shop?.isOpen !== false
    );

    setUpdatedItemsList(
      category === "All"
        ? openItems
        : openItems.filter((i) => i.category === category)
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="w-screen min-h-screen flex flex-col bg-[#fff9f6]">
      <Nav />

      {/* SLIDER */}
      <div className="w-full max-w-6xl mx-auto mt-20">
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 2500 }}
          loop
          pagination={{ clickable: true }}
        >
          {[banner1, banner2, banner3, banner4].map((b, i) => (
            <SwiperSlide key={i}>
              <img src={b} className="w-full h-64 object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* SEARCH ITEMS */}
      {searchItems?.length > 0 && (
        <div className="max-w-6xl mx-auto mt-6 p-5 bg-white rounded-xl">
          <h2 className="font-semibold mb-4">SEARCH RESULTS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {searchItems.map((i) => (
              <FoodCardCompact
                key={i._id}
                data={i}
                onClick={setModalItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* SHOPS */}
      <div className="max-w-6xl mx-auto mt-10">
        <h2 className="font-semibold mb-4">Best Shops Near You</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {shopInMyCity?.map((shop) => (
            <div
              key={shop._id}
              onClick={() => navigate(`/shop/${shop._id}`)}
              className="cursor-pointer bg-white rounded-xl shadow"
            >
              <img
                src={getImageUrl(shop.image)}
                className="h-48 w-full object-cover rounded-t-xl"
              />
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
