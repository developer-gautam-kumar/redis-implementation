import express from "express";
import "./config/redis.js"; // Just importing connects Redis
import rateLimiter from "./middlewares/rateLimiter.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";

/**
 * Middleware to capture request analytics
 */

const app = express();

app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
// Global rate limiter — applies to all routes
// app.use(rateLimiter({ windowSec: 60, maxRequests: 100 }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
export const captureAnalytics = (req, res, next) => {
  try {
    // ✅ 1. Safe Headers Access
    const headers = req.headers || {};

    // ✅ 2. Safe IP Extraction
    let ip =
      headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      "";

    // Normalize IPv6
    if (ip && ip.includes("::ffff:")) {
      ip = ip.split("::ffff:")[1];
    }

    // Fallback
    if (!ip) ip = "0.0.0.0";

    // ✅ 3. Safe User-Agent
    const userAgent = headers["user-agent"] || "";

    // ✅ 4. Parse UA safely
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // ✅ 5. Extract Data (safe optional chaining)
    const browser = result.browser?.name || "unknown";
    const browserVersion = result.browser?.version || "unknown";

    const os = result.os?.name || "unknown";
    const osVersion = result.os?.version || "unknown";

    const deviceType = result.device?.type || "desktop";
    const deviceVendor = result.device?.vendor || "unknown";
    const deviceModel = result.device?.model || "unknown";

    const cpu = result.cpu?.architecture || "unknown";

    // ✅ 6. Geo Lookup (safe)
    let geo = {};
    try {
      geo = geoip.lookup(ip) || {};
    } catch (e) {
      geo = {};
    }

    const country = geo.country || "unknown";
    const region = geo.region || "unknown";
    const city = geo.city || "unknown";
    const timezone = geo.timezone || "unknown";

    // ✅ 7. Attach to request (IMPORTANT)
    req.analytics = {
      ip,
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType,
      deviceVendor,
      deviceModel,
      cpu,
      country,
      region,
      city,
      timezone,
      userAgent,
      createdAt: new Date(),
    };

    // Debug (optional)
    console.log(req.analytics);

    next();
  } catch (error) {
    console.error("Analytics Middleware Error:", error);
    next(); // never block request
  }
};

app.use(captureAnalytics);
// Health check
app.get("/", (req, res) => res.json({ message: "🚀 Server is running" }));
app.use((err, req, res, next) => {
  console.log(err);

  res.json({
    err: err,
  });
});



export { app };
