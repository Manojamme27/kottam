import { createSlice } from "@reduxjs/toolkit";

// Load saved user
const savedUser = JSON.parse(localStorage.getItem("userData"));
const cachedShops = JSON.parse(localStorage.getItem("shops_cache")) || [];
const cachedItems = JSON.parse(localStorage.getItem("items_cache")) || [];


// Load user's cart
const savedCart =
  savedUser?._id
    ? JSON.parse(localStorage.getItem(`cartItems_${savedUser._id}`)) || []
    : [];

const savedTotal = savedCart.reduce(
  (sum, i) => sum + i.price * i.quantity,
  0
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: savedUser || null,

    currentCity: null,
    currentState: null,
    currentAddress: null,

    shopInMyCity: cachedShops,     // NOW MEANS: ALL SHOPS
    itemsInMyCity: cachedItems,    // NOW MEANS: ALL ITEMS

    cartItems: savedCart,
    totalAmount: savedTotal,

    myOrders: [],

    searchItems: [],               // ✅ SAFE
    searchShops: [],               // ✅ SAFE

    socket: null,
  },


  reducers: {
    // ======================================================
    // USER + LOCATION REDUCERS (KEEPING ORIGINAL)
    // ======================================================
    setUserData: (state, action) => {
     state.userData = action.payload;



      if (action.payload?._id) {
        const key = `cartItems_${action.payload._id}`;
        const userCart = JSON.parse(localStorage.getItem(key)) || [];

        state.cartItems = userCart;
        state.totalAmount = userCart.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );

        localStorage.setItem("userData", JSON.stringify(action.payload));
      } else {
        state.cartItems = [];
        state.totalAmount = 0;
        state.myOrders = []; // ✅ FIX: clear orders on logout
        localStorage.removeItem("userData");
      }

    },

    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },

    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },

    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },

    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = Array.isArray(action.payload) ? action.payload : [];
    },

    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = Array.isArray(action.payload) ? action.payload : [];
    },

    setSocket: (state, action) => {
      state.socket = action.payload;
    },

    // ======================================================
    // CART SYSTEM (UNCHANGED)
    // ======================================================
    addToCart: (state, action) => {
      const item = action.payload;

      const shopId =
        typeof item.shop === "string"
          ? item.shop
          : item.shop?._id
            ? item.shop._id
            : null;

      const existing = state.cartItems.find((i) => i.id === item.id);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.cartItems.push({ ...item, shop: shopId });
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      if (state.userData?._id) {
        localStorage.setItem(
          `cartItems_${state.userData._id}`,
          JSON.stringify(state.cartItems)
        );
      }
    },

    updateQuantity: (state, action) => {
      const { id, quantity, shop } = action.payload;

      const item = state.cartItems.find((i) => i.id === id);
      if (item) {
        item.quantity = quantity;

        item.shop =
          typeof item.shop === "string"
            ? item.shop
            : item.shop?._id
              ? item.shop._id
              : shop;
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      if (state.userData?._id) {
        localStorage.setItem(
          `cartItems_${state.userData._id}`,
          JSON.stringify(state.cartItems)
        );
      }
    },

    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (i) => i.id !== action.payload
      );

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      if (state.userData?._id) {
        localStorage.setItem(
          `cartItems_${state.userData._id}`,
          JSON.stringify(state.cartItems)
        );
      }
    },

    clearCart: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;

      if (state.userData?._id) {
        localStorage.removeItem(
          `cartItems_${state.userData._id}`
        );
      }
    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload;
    },

    // ======================================================
    // ORDERS SYSTEM (YOUR LOGIC + PATCHED)
    // ======================================================
    setMyOrders: (state, action) => {
      if (!state.userData?._id) return; // ✅ PREVENT token error
      state.myOrders = Array.isArray(action.payload)
        ? action.payload
        : [];
    },


    addMyOrder: (state, action) => {
      if (!state.userData?._id) return; // ✅ PREVENT token error
      state.myOrders = [action.payload, ...state.myOrders];
    },

    // ⭐ PATCHED — ALWAYS SAFE FOR BOTH USER & OWNER
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;

      const order = state.myOrders.find((o) => o._id === orderId);
      if (!order) return;

      const shopOrders = Array.isArray(order.shopOrders)
        ? order.shopOrders
        : [order.shopOrders];

      const shopOrder = shopOrders.find(
        (so) =>
          String(so.shop?._id || so.shop) === String(shopId)
      );

      if (shopOrder) shopOrder.status = status;

      // OWNER gets single object, USER keeps array
      order.shopOrders =
        state.userData?.role === "owner"
          ? shopOrder
          : shopOrders;
    },

    // ⭐ PATCHED — SOCKET REALTIME FIX
    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;

      const order = state.myOrders.find((o) => o._id === orderId);
      if (!order) return;

      const shopOrders = Array.isArray(order.shopOrders)
        ? order.shopOrders
        : [order.shopOrders];

      const shopOrder = shopOrders.find(
        (so) =>
          String(so.shop?._id || so.shop) === String(shopId)
      );

      if (shopOrder) shopOrder.status = status;

      order.shopOrders =
        state.userData?.role === "owner"
          ? shopOrder
          : shopOrders;
    },

    setSearchItems: (state, action) => {
      state.searchItems = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    setSearchShops: (state, action) => {
      state.searchShops = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    clearSearchResults: (state) => {
      state.searchItems = [];
      state.searchShops = [];
    },



  },
});

export const {
  setUserData,
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setShopsInMyCity,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  clearCart,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  setSearchItems,
  setSearchShops,
  clearSearchResults,
  setTotalAmount,
  updateRealtimeOrderStatus,
  setSocket,
} = userSlice.actions;

export default userSlice.reducer;







