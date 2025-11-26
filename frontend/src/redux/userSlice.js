import { createSlice } from "@reduxjs/toolkit";

// Load saved user
const savedUser = JSON.parse(localStorage.getItem("userData"));
const userId = savedUser?._id || "guest";
const cartKey = `cartItems_${userId}`;

// Load user's cart
const savedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
const savedTotal = savedCart.reduce((sum, i) => sum + i.price * i.quantity, 0);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: savedUser || null,
    currentCity: null,
    currentState: null,
    currentAddress: null,

    shopInMyCity: null,
    itemsInMyCity: null,

    cartItems: savedCart,
    totalAmount: savedTotal,

    myOrders: [],
    searchItems: null,
    socket: null,
  },

  reducers: {
    // ========== USER DATA ==========
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
        localStorage.removeItem("userData");
      }
    },

    // ========== RESTORED LOGIC FOR CITY ACCESS ==========
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },

    // ========== SOCKET ==========
    setSocket: (state, action) => {
      state.socket = action.payload;
    },

    // ========== ORDERS ==========
    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },

    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders];
    },

    // normalize shopOrders → always array
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;

      const order = state.myOrders.find((o) => o._id === orderId);
      if (!order) return;

      const shopOrders = Array.isArray(order.shopOrders)
        ? order.shopOrders
        : [order.shopOrders];

      const shopOrder = shopOrders.find(
        (so) => String(so.shop?._id) === String(shopId)
      );

      if (shopOrder) {
        shopOrder.status = status;
      }

      order.shopOrders = shopOrders;
    },

    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;

      const order = state.myOrders.find((o) => o._id === orderId);
      if (!order) return;

      const shopOrders = Array.isArray(order.shopOrders)
        ? order.shopOrders
        : [order.shopOrders];

      const shopOrder = shopOrders.find(
        (so) => String(so.shop?._id) === String(shopId)
      );

      if (shopOrder) {
        shopOrder.status = status;
      }

      order.shopOrders = shopOrders;
    },
  },
});

export const {
  setUserData,
  setCurrentCity,
  setCurrentState,
  setCurrentAddress,
  setSocket,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  updateRealtimeOrderStatus,
} = userSlice.actions;

export default userSlice.reducer;
