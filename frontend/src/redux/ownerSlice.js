import { createSlice } from "@reduxjs/toolkit";

const ownerSlice = createSlice({
    name: "owner",
    initialState: {
        myShopData: null,
        notifications: []     // 🔔 NEW
    },
    reducers: {
        setMyShopData: (state, action) => {
            state.myShopData = action.payload;
        },

        addNotification: (state, action) => {
            state.notifications.unshift({
                ...action.payload,
                read: false,
                time: Date.now(),
            });

            // limit to last 20 notifications
            if (state.notifications.length > 20) {
                state.notifications.pop();
            }
        },

        markAllRead: (state) => {
            state.notifications = state.notifications.map((n) => ({
                ...n,
                read: true,
            }));
        },
    },
});

export const { setMyShopData, addNotification, markAllRead } = ownerSlice.actions;
export default ownerSlice.reducer;
