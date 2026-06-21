const express = require("express");
const {
  getPendingDonations,
  verifyDonation,
  rejectDonation,
} = require("../../controllers/adminController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");
const router = express.Router();

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
