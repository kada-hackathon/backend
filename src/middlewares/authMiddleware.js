const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    // Ambil token dari cookie atau header (case-insensitive)
    let token =
      req.cookies?.token ||
      req.headers?.authorization?.replace(/bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // Verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
