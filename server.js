require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1); // behind Vercel/proxy: needed for correct client IPs in rate limiting
const PORT = process.env.PORT || 5001;

// Sites allowed to call the API with cookies. The production frontends are
// built in so a stale or mistyped CLIENT_URL env var can never lock the real
// site out; the env vars add more (e.g. http://localhost:5173 for dev).
// Trailing slashes are dropped because browsers never send one in Origin.
const normalizeOrigin = (url) => (url || "").trim().replace(/\/+$/, "");
const allowedOrigins = new Set(
  [
    "https://zaroorat.xyz",
    "https://www.zaroorat.xyz",
    "https://frontend-seven-ivory-56.vercel.app",
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_1,
    process.env.CLIENT_URL_2,
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600, // browsers may reuse a preflight answer for 10 minutes
  })
);


app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
// Strip NoSQL operator keys from request bodies (injection defence).
app.use(require("./middleware/sanitizeBody"));

// Basic abuse protection. Note: on serverless each instance keeps its own
// counter, so these are a first line of defence, not a hard guarantee.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
const donateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { msg: "Too many donation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
// The contact form sends email from the platform's Gmail account, so keep it
// tight enough that a bot can't burn through Gmail's daily sending limit.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { msg: "Too many messages from this connection. Please try again later, or email us directly." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

const connectDB = require("./config/mongoDBConnection/db");
connectDB();

const userAuthRoute = require("./routes/auth/user");
const fundRoute = require("./routes/fund/fund");
const donarRoute = require("./routes/donar/donar");
const ProfileRoute = require("./routes/profile/userProfile");
const googleAuthRoute = require("./routes/googleAuthRoute/loginWithGoogle");
const fundRaiseApprovalRoute = require("./routes/adminRoute/fundRaiseApproval");
const deletionRequestRoute = require("./routes/adminRoute/deletionRequest");
const donationVerificationRoute = require("./routes/adminRoute/donationVerification");
const userDetailRoute = require("./routes/adminRoute/userDetails");
const contactRoute = require("./routes/contact/contact");
app.use("/api/auth", authLimiter, userAuthRoute, googleAuthRoute);
app.use(
  "/api/admin",
  fundRaiseApprovalRoute,
  deletionRequestRoute,
  donationVerificationRoute,
  userDetailRoute
);
app.use("/api/user", ProfileRoute);
app.use("/api/fund", fundRoute);
app.use("/api/donar", donateLimiter, donarRoute);
app.use("/api/contact", contactLimiter, contactRoute);

// Centralised error handler — clean JSON, never leaks stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ msg: "Image too large. Please upload a file under 8MB." });
  }
  if (err && /Only JPG|Not allowed by CORS/i.test(err.message || "")) {
    return res.status(400).json({ msg: err.message });
  }
  console.error("Unhandled error:", err && err.message);
  res.status(500).json({ msg: "Something went wrong. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
