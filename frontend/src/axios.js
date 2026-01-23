import axios from "axios";
import { serverUrl } from "../App";

const api = axios.create({
    baseURL: serverUrl,
    withCredentials: true,
    timeout: 15000, // prevents hanging requests
});

// 🔥 GLOBAL RESPONSE HANDLER
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Global 401 — session expired");

            // 🔥 hard redirect (no UI freeze)
            if (window.location.pathname !== "/signin") {
                window.location.href = "/signin";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
