import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaPen } from 'react-icons/fa';
import Nav from './Nav';
import OwnerItemCard from './ownerItemCard';
import useGetMyshop from '../hooks/useGetMyshop';
import axios from 'axios';
import { serverUrl } from '../App';
import useOwnerSocket from "../hooks/useOwnerSocket";
import useOwnerNotifications from "../hooks/useOwnerNotifications";
import { useDispatch } from "react-redux";
import { setShopsInMyCity, setItemsInMyCity } from "../redux/userSlice";




function OwnerDashboard() {
  const { myShopData } = useSelector(state => state.owner);
  const { userData } = useSelector(state => state.user);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const dispatch = useDispatch();


  useGetMyshop();
  useOwnerSocket();
  useOwnerNotifications();



  // 🔥 Fetch owner order stats (today, week, total)
  // 🔥 Auto-refresh owner stats every 10 seconds
  
  useEffect(() => {
    let interval;

    const fetchStats = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/order/stats/owner`, {
          withCredentials: true,
        });
        setStats(res.data);
      } catch (error) {
        console.log("Stats load error →", error);
      }
    };

    if (myShopData?._id) {
      fetchStats(); // Initial load

      interval = setInterval(() => {
        fetchStats();   // Auto refresh every 10 seconds
      }, 10000);
    }

    return () => clearInterval(interval); // cleanup on unmount
  }, [myShopData]);

  const handleToggleShopStatus = async () => {
    try {
      await axios.put(`${serverUrl}/api/shop/toggle-status`, {}, { withCredentials: true });

      window.location.reload();   // works instantly
    } catch (err) {
      console.log("Toggle error:", err);
    }
  };


  return (
    <div className="min-h-screen bg-[#fff9f6] flex flex-col items-center">
      <Nav />

      {/* 🚫 If shop not created */}
      {!myShopData && userData?.role === 'owner' && (
        <div className="flex justify-center items-center mt-20 px-4">
          <div className="w-full max-w-md bg-white border border-orange-100 shadow-lg rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300">
            <FaUtensils className="text-[#ff4d2d] w-16 h-16 mx-auto mb-5 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Your Shop</h2>
            <p className="text-gray-600 text-sm mb-5">
              Join our delivery platform and reach thousands of customers every day.
            </p>
            <button
              className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-8 py-2 rounded-full font-semibold shadow-md transition-transform hover:scale-105"
              onClick={() => navigate('/create-edit-shop')}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* 🟩 Shop exists */}
      {myShopData && (
        <div className="w-full flex flex-col items-center gap-8 px-4 py-10">

          {/* 🌟 Welcome */}
          <div className="text-center">
            <div className="flex flex-col items-center text-center mb-2">
              <FaUtensils className="text-[#ff4d2d] w-10 h-10 mb-2" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Welcome to {myShopData.name}
              </h1>
            </div>
            

            <p className="text-gray-600 text-sm">
              Manage your menu, track orders, and delight your customers 🍽️
            </p>
          </div>

          {/* 🆕 NEW — Stats Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full">

            <StatCard
              title="Total Items"
              value={myShopData?.items?.length}
              color="text-[#ff4d2d]"
            />

            <StatCard
              title="Today Orders"
              value={stats?.todayOrders ?? 0}
              color="text-green-600"
            />

            <StatCard
              title="Week Orders"
              value={stats?.weekOrders ?? 0}
              color="text-blue-600"
            />

            <StatCard
              title="Total Orders"
              value={stats?.totalOrders ?? 0}
              color="text-purple-600"
            />

          </div>

          {/* 🏪 Shop Card */}
          <div className="relative bg-white border border-orange-100 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 max-w-3xl w-full">
            <div className="relative">
              <img
                src={myShopData.image}
                alt={myShopData.name}
                className="w-full h-56 sm:h-64 object-cover brightness-[0.95]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
              <div
                className="absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full shadow-md hover:bg-[#e64526] transition cursor-pointer"
                onClick={() => navigate('/create-edit-shop')}
                title="Edit Shop"
              >
                <FaPen size={18} />
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{myShopData.name}</h2>
              <p className="text-gray-600 text-sm mb-1">{myShopData.city}, {myShopData.state}</p>
              <p className="text-gray-500 text-sm">{myShopData.address}</p>
            </div>
          </div>
          {/* 🟢 Shop Open/Close Toggle */}
          {/* 🟢 Shop Open/Close Toggle */}
          <div className="p-4 flex items-center justify-between border-t mt-2">
            <p className="text-gray-700 font-semibold">Shop Status:</p>

            <label className="flex items-center cursor-pointer">
              <span className={`mr-3 font-bold ${myShopData.isOpen ? "text-green-600" : "text-red-600"}`}>
                {myShopData.isOpen ? "OPEN" : "CLOSED"}
              </span>

              <div
                onClick={handleToggleShopStatus}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${myShopData.isOpen ? "bg-green-500" : "bg-gray-400"
                  }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition ${myShopData.isOpen ? "translate-x-6" : "translate-x-0"
                    }`}
                />
              </div>
            </label>
          </div>


          {/* 🟧 No Items */}
          {myShopData.items.length === 0 && (
            <div className="w-full max-w-md bg-white border border-orange-100 rounded-2xl p-8 text-center shadow-md hover:shadow-lg transition-all duration-300">
              <FaUtensils className="text-[#ff4d2d] w-16 h-16 mx-auto mb-5" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Your Item</h2>
              <p className="text-gray-600 text-sm mb-4">
                Share your delicious creations with our customers by adding them to the menu.
              </p>
              <button
                className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-8 py-2 rounded-full font-semibold shadow-md hover:scale-105 transition-transform"
                onClick={() => navigate('/add-item')}
              >
                Add Food
              </button>
            </div>
          )}

          {/* 🍽 Items List */}
          {myShopData.items.length > 0 && (
            <div className="flex flex-wrap gap-5 justify-center">
              {myShopData?.items?.map((item) => (
                <OwnerItemCard key={item._id} data={item} />
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default OwnerDashboard;

// ⭐ Reusable Stat Card Component
function StatCard({ title, value, color }) {
  return (
    <div className="bg-white border border-orange-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
    </div>
  );
}
