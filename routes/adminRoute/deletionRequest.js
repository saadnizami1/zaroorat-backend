const express = require("express");
const router = express.Router();
const {
  handleApproveDeletion,
  handleRejectDeletion,
  getAllPendingDeletions,
} = require("../../controllers/deletionController");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

router.get(
  "/account-deletion/pending-requests",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  getAllPendingDeletions
);
router.put(
  "/account-deletion/approve/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  handleApproveDeletion
);
router.put(
  "/account-deletion/reject/:id",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["admin"]),
  handleRejectDeletion
);

module.exports = router;
