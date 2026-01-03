import React, { useEffect, useState } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { TbCurrentLocation } from "react-icons/tb";
import { IoLocationSharp } from "react-icons/io5";
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// FIX Leaflet marker icon issue in Vercel/React builds
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

import { setAddress, setLocation } from '../redux/mapSlice';
import { MdDeliveryDining } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa";
import { FaMobileScreenButton } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { addMyOrder, clearCart } from '../redux/userSlice.js';
import axios from 'axios';
import { toast } from "react-toastify";

// ✅ Delivery fee slab helper (same logic we use in backend)
const calculateDeliveryFee = (amount) => {
  if (amount < 100) return 0;
  if (amount >= 100 && amount <= 199) return 30;
  if (amount >= 200 && amount <= 499) return 40;
  if (amount >= 500 && amount <= 999) return 50;
  if (amount >= 1000) return 50;
  return 0;
};

function RecenterMap({ location }) {
  if (location.lat && location.lon) {
    const map = useMap();
    map.setView([location.lat, location.lon], 16, { animate: true });
  }
  return null;
}

function CheckOut() {
  const { location, address } = useSelector(state => state.map);
  const { cartItems, totalAmount, userData } = useSelector(state => state.user); // totalAmount = items subtotal
  const [addressInput, setAddressInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shopCharges, setShopCharges] = useState([]); // per-shop subtotal + fee
  const [totalDeliveryFee, setTotalDeliveryFee] = useState(0);
  const [grandTotal, setGrandTotal] = useState(totalAmount);
  const [placingOrder, setPlacingOrder] = useState(false);


  const navigate = useNavigate();
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  // 🔢 Derive per-shop delivery fee + grand total from cart
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      setShopCharges([]);
      setTotalDeliveryFee(0);
      setGrandTotal(totalAmount || 0);
      return;
    }

    // Group cart items by shop
    const shopMap = {};
    cartItems.forEach((item) => {
      const shopId = item.shop; // assuming item.shop has shop _id
      if (!shopMap[shopId]) {
        shopMap[shopId] = {
          shopId,
          shopName: item.shopName || item.shopNameDisplay || "Shop",
          subtotal: 0,
          deliveryFee: 0,
        };
      }
      shopMap[shopId].subtotal += Number(item.price) * Number(item.quantity);
    });

    const shopsArray = Object.values(shopMap);
    let feeSum = 0;

    shopsArray.forEach((s) => {
      s.deliveryFee = calculateDeliveryFee(s.subtotal);
      feeSum += s.deliveryFee;
    });

    setShopCharges(shopsArray);
    setTotalDeliveryFee(feeSum);
    setGrandTotal(Number(totalAmount || 0) + feeSum);
  }, [cartItems, totalAmount]);

  const onDragEnd = (e) => {
    const { lat, lng } = e.target._latlng;
    dispatch(setLocation({ lat, lon: lng }));
    getAddressByLatLng(lat, lng);
  };

  const getCurrentLocation = () => {
  if (!userData?.location?.coordinates?.length) {
    toast.error("Current location not available yet");
    return;
  }

  const latitude = userData.location.coordinates[1];
  const longitude = userData.location.coordinates[0];

  dispatch(setLocation({ lat: latitude, lon: longitude }));
  getAddressByLatLng(latitude, longitude);
};

 const getAddressByLatLng = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`
    );

    const data = await res.json();
    const place = data?.results?.[0];
    if (!place) return;

    const fullAddress = [
      place.house_number && place.street
        ? `${place.house_number} ${place.street}`
        : place.street,
      place.suburb,
      place.neighbourhood,
      place.district,
      place.city,
      place.state,
      place.postcode,
    ]
      .filter(Boolean)
      .join(", ");

    dispatch(setAddress(fullAddress));
    setAddressInput(fullAddress);

  } catch (err) {
    console.log("Reverse geocoding failed:", err);
  }
};


  const getLatLngByAddress = async () => {
  if (!addressInput || addressInput.trim() === "") {
    toast.error("Please enter delivery address");
    return;
  }

  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        addressInput
      )}&apiKey=${apiKey}`
    );

    const data = await res.json();
    const place = data?.features?.[0]?.properties;
    if (!place) return;

    dispatch(setLocation({ lat: place.lat, lon: place.lon }));
  } catch (error) {
    console.log("Geocoding failed:", error);
  }
};



      const { lat, lon } = result.data.features[0].properties;
      dispatch(setLocation({ lat, lon }));
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!addressInput || !location?.lat || !location?.lon) {
  toast.error("Please select delivery address");
  return;
}

    if (!userData?._id) {
  toast.error("Please login to place an order");
  navigate("/signin");
  return;
}

  if (placingOrder) return; // prevents double click
    const shopTotals = {};
  cartItems.forEach((item) => {
    const shopId = item.shop;
    if (!shopTotals[shopId]) shopTotals[shopId] = 0;
    shopTotals[shopId] += Number(item.price) * Number(item.quantity);
  });

  const invalidShops = Object.values(shopTotals).filter(total => total < 100);

  if (invalidShops.length > 0) {
    toast.error("Minimum order ₹100 required for each shop", {
      position: "top-center",
    });
    return; // ❌ STOP → Do NOT place order
  }

  setPlacingOrder(true);
  try {
    const result = await axios.post(
  `${serverUrl}/api/order/place-order`,
  {
    paymentMethod,
    deliveryAddress: {
      text: addressInput,
      latitude: location.lat,
      longitude: location.lon,
    },
    totalAmount: grandTotal,
    cartItems,
  },
  { withCredentials: true }
);


    if (paymentMethod === "cod") {
      dispatch(addMyOrder(result.data));
      dispatch(clearCart());
      toast.success("Order placed successfully!", { position: "top-center" });
      navigate("/order-placed");
    } else {
      const orderId = result.data.orderId;
      const razorOrder = result.data.razorOrder;
      openRazorpayWindow(orderId, razorOrder);
    }

} catch (error) {
  // 🔐 SESSION EXPIRED / NOT AUTHENTICATED
  if (error.response?.status === 401) {
    toast.error("Session expired. Please login again.", {
      position: "top-center",
    });

    navigate("/signin");   // ⬅️ VERY IMPORTANT
    return;
  }

  // ❌ OTHER BACKEND ERRORS
  const msg = error?.response?.data?.message;

  toast.error(
    msg || "Failed to place order. Try again later.",
    { position: "top-center" }
  );

  console.log("Place order error:", error);
}



  setPlacingOrder(false);
};


  // ✅ Razorpay integration
  const openRazorpayWindow = (orderId, razorOrder) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorOrder.amount,
      currency: 'INR',
      name: "Kottam",
      description: "Food Delivery Website",
      order_id: razorOrder.id,
      handler: async function (response) {
        try {
          const result = await axios.post(
            `${serverUrl}/api/order/verify-payment`,
            {
              razorpay_payment_id: response.razorpay_payment_id,
              orderId,
            },
            { withCredentials: true }
          );

          dispatch(addMyOrder(result.data));

          // ✅ Clear cart only after verified payment
          dispatch(clearCart());
          toast.success("Payment successful and order placed!", { position: "top-center" });

          navigate("/order-placed");
        } catch (error) {
          toast.error("Payment verification failed. Try again later.", { position: "top-center" });
          console.log(error);
        }
      },
      theme: { color: "#ff4d2d" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    setAddressInput(address);
  }, [address]);

  return (
    <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
      <div className='absolute top-5 left-5 z-10' onClick={() => navigate("/")}>
        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d] cursor-pointer hover:scale-110 transition-transform' />
      </div>

      <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Checkout</h1>

        {/* Location Section */}
        <section>
          <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
            <IoLocationSharp className='text-[#ff4d2d]' /> Delivery Location
          </h2>
          <div className='flex gap-2 mb-3'>
            <input
              type="text"
              className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
              placeholder='Enter Your Delivery Address..'
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
            />
            <button
              className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded-lg flex items-center justify-center'
              onClick={getLatLngByAddress}
            >
              <IoSearchOutline size={17} />
            </button>
            <button
              className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center'
              onClick={getCurrentLocation}
            >
              <TbCurrentLocation size={17} />
            </button>
          </div>

          <div className='rounded-xl border overflow-hidden'>
            <div className='h-64 w-full flex items-center justify-center'>

              {/* Prevent map crash before location exists */}
              {location?.lat && location?.lon ? (
                <MapContainer
                  className="w-full h-full"
                  center={[location.lat, location.lon]}
                  zoom={16}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap location={location} />
                  <Marker
                    position={[location.lat, location.lon]}
                    draggable
                    eventHandlers={{ dragend: onDragEnd }}
                  />
                </MapContainer>
              ) : (
                <div className="text-gray-500">Loading map…</div>
              )}

            </div>
          </div>

        </section>

        {/* Payment Method */}
        <section>
          <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "cod"
                ? "border-[#ff4d2d] bg-orange-50 shadow"
                : "border-gray-200 hover:border-gray-300"
                }`}
              onClick={() => setPaymentMethod("cod")}
            >
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                <MdDeliveryDining className='text-green-600 text-xl' />
              </span>
              <div>
                <p className='font-medium text-gray-800'>Cash On Delivery</p>
                <p className='text-xs text-gray-500'>Pay when your Item arrives</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "online"
                ? "border-[#ff4d2d] bg-orange-50 shadow"
                : "border-gray-200 hover:border-gray-300"
                }`}
              onClick={() => setPaymentMethod("online")}
            >
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                <FaMobileScreenButton className='text-purple-700 text-lg' />
              </span>
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                <FaCreditCard className='text-blue-700 text-lg' />
              </span>
              <div>
                <p className='font-medium text-gray-800'>UPI / Credit / Debit Card</p>
                <p className='text-xs text-gray-500'>Pay Securely Online</p>
              </div>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        {/* Order Summary */}
        <section>
          <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>
          <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>
            {cartItems.map((item, index) => (
              <div key={index} className='flex justify-between text-sm text-gray-700'>
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}

            <hr className='border-gray-200 my-2' />

            <div className='flex justify-between font-medium text-gray-800'>
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>

            {/* Single Delivery Fee (one shop only) */}
            <div className='flex justify-between text-gray-700 text-sm'>
              <span>Delivery Fee</span>
              <span>{totalDeliveryFee === 0 ? "Free" : `₹${totalDeliveryFee}`}</span>
            </div>

            <div className='flex justify-between text-lg font-bold text-[#ff4d2d] pt-2'>
              <span>Total</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </section>

        {/* Place Order Button */}
        <button
  disabled={placingOrder}
  className={`w-full text-white py-3 rounded-xl font-semibold transition-all duration-200 
    ${placingOrder ? "bg-gray-400 cursor-not-allowed" : "bg-[#ff4d2d] hover:bg-[#e64526]"}`}
  onClick={handlePlaceOrder}
>
  {placingOrder ? (
    <div className="flex items-center justify-center gap-2">
      <span className="loader h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Processing...
    </div>
  ) : (
    paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"
  )}
</button>

      </div>
    </div>
  );
}

export default CheckOut;















