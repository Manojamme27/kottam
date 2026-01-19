import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {

  // ✅ ALLOW PREFLIGHT REQUESTS (CRITICAL FIX)
  if (req.method === "OPTIONS") {
    return next();
  }

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default isAuth;
