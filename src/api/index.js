import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import swaggerSetup from "../swagger.js";

import config from "../config/index.js";
import { connectDB } from "../db/connection.js";
import { errorHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

import authRoutes from "../routes/auth.js";
import gameRoutes from "../routes/game.js";
import leaderboardRoutes from "../routes/leaderboard.js";
import questionRoutes from "../routes/question.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(rateLimit(config.rateLimit));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Additional security headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  })
);

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy());

// Performance middleware
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// Swagger setup
swaggerSetup(app);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/game", gameRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/questions", questionRoutes);

// Error handling - make sure this comes after all routes
app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

// Handle 404 - make sure this comes after all routes but before error handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Connect to the database and start the server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});

// Export the app for testing or further integration
export default app;
