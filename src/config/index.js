import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 100,
      ssl: process.env.NODE_ENV === "production",
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "7d",
    algorithm: "HS256",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later",
  },
  security: {
    bcryptSaltRounds: 12,
    requestSizeLimit: "10kb",
  },
};
