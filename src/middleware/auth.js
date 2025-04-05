import jwt from "jsonwebtoken";
import config from "../config/index.js";
import logger from "../utils/logger.js";

export default (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token with specific algorithm
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: [config.jwt.algorithm],
    });

    // Check token expiration
    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: "Token expired" });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};
