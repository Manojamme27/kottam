import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    // ❌ not authenticated
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: correct payload key
    req.userId = decodedToken.id;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default isAuth;
