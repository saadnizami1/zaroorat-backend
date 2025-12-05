const express = require("express");
const {
  getPendingFunds,
  approveFund,
  rejectFund,
  getPendingDonations,  // ✅ ADD
  verifyDonation,       // ✅ ADD
  rejectDonation,       // ✅ ADD
} = require("../../controllers/adminController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");
const { adminDeleteFund } = require("../../controllers/fundController");
const router = express.Router();

// Existing fund approval routes
router.get(
  "/fund-raise/pending-funds",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  getPendingFunds
);
router.put(
  "/fund-raise/approve-fund/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  approveFund
);
router.delete(
  "/fund-raise/reject-fund/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  rejectFund
);
router.delete(
  "/fund-raise/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  adminDeleteFund
);

// ✅ ADD THESE 3 NEW ROUTES FOR DONATION VERIFICATION
router.get(
  "/donations/pending",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  getPendingDonations
);

router.put(
  "/donations/verify/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  verifyDonation
);

router.delete(
  "/donations/reject/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  rejectDonation
);

module.exports = router;
