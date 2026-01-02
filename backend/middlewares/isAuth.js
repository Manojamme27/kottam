import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
    try {
        // ✅ 1. READ COOKIE SAFELY
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        // ✅ 2. VERIFY TOKEN
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.userId) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        // ✅ 3. ATTACH USER ID
        req.userId = decoded.userId;

        next();

    } catch (error) {
        // ✅ 4. HANDLE TOKEN EXPIRY SEPARATELY
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Session expired. Please login again.",
            });
        }

        // ✅ 5. HANDLE INVALID TOKEN
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        // ✅ 6. LOG REAL ERROR (SERVER SIDE)
        console.error("❌ isAuth middleware error:", error);

        return res.status(500).json({
            message: "Authentication failed",
        });
    }
};

export default isAuth;
