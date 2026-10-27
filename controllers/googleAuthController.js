const axios = require("axios");
require("dotenv").config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const CLIENT_URL_1 = process.env.CLIENT_URL_1 || "https://zaroorat.xyz";
const qs = require("querystring");
const User = require("../models/userModel");
const setTokenCookie = require("../authService/setTokenCookie");
const { createToken } = require("../authService/authService");

// Send the visitor back to the sign-in page, which explains what happened,
// instead of leaving them on a raw JSON error from the API domain.
const failToSignin = (res) => res.redirect(`${CLIENT_URL_1}/signin?google=failed`);

const redirectToGoogle = (req, res) => {
  const googleAuthURL =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid profile email`;
  res.redirect(googleAuthURL);
};

const googleCallback = async (req, res) => {
  const { code } = req.query;

  // No code = the visitor cancelled on Google's screen (or Google reported an error).
  if (!code) {
    return failToSignin(res);
  }

  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = response.data;

    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { sub: googleId, name, email, picture } = userResponse.data;

    if (!googleId) {
      return failToSignin(res);
    }

    let user = await User.findOne({ googleId });

    if (user) {
      if (user.email !== email) {
        user.email = email;
        await user.save();
      }
    } else {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({
          googleId,
          fullName: name,
          email,
          profilePhoto: picture,
          password: null,
          role: "user",
        });
      }
    }

    // Same rule as email/password login.
    if (user.status && user.status !== "active") {
      return failToSignin(res);
    }

    // Same token as email/password login (fullName/phone in the payload, 1-day
    // expiry) — the old 1-hour token logged Google users out after an hour.
    const token = createToken(user);
    if (!token) return failToSignin(res);
    setTokenCookie(res, token);
    const encodedName = encodeURIComponent(user.fullName);
    const encodedEmail = encodeURIComponent(user.email);
    const encodedRole = encodeURIComponent(user.role);

    return res.redirect(
      `${CLIENT_URL_1}/?name=${encodedName}&email=${encodedEmail}&role=${encodedRole}`
    );
  } catch (error) {
    console.error("Google login error:", error.response?.data || error.message);
    return failToSignin(res);
  }
};

module.exports = {
  googleCallback,
  redirectToGoogle,
};
