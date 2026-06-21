const express = require("express");
const {
  getPendingFunds,
  approveFund,
  rejectFund,
  getManagedFunds,
  pauseFund,
  resumeFund,
} = require("../../controllers/adminController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");
const { adminDeleteFund } = require("../../controllers/fundController");
const router = express.Router();

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

router.get(
  "/fund-raise/manage",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  getManagedFunds
);

// Suspend / resume a live campaign (e.g. suspected fraud) without deleting it
router.put(
  "/fund-raise/pause-fund/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  pauseFund
);
router.put(
  "/fund-raise/resume-fund/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  resumeFund
);

router.delete(
  "/fund-raise/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  adminDeleteFund
);

module.exports = router;
