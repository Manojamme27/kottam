import axios from "axios";
import { serverUrl } from "../App";

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true, // 🔥 ALWAYS SEND COOKIE
});

export default api;
