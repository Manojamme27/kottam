// ✅ Centralized utility for images
import { serverUrl } from "../App";

export const getImageUrl = (path) => {
    if (!path) return "/placeholder.png"; // optional fallback
    return path.startsWith("http") ? path : `${serverUrl}${path}`;
};
