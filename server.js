require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1); // behind Vercel/proxy: needed for correct client IPs in rate limiting
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_1,
  process.env.CLIENT_URL_2,
];

app.use(
  cors({
    origin: function (origin, callback) {
  
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

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


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
