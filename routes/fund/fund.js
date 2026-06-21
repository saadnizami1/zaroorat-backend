const express = require("express");
const upload = require("../../middleware/cloundinaryUpload");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");
const {
  handleCreateFund,
  getAllFunds,
  getFundById,
  getDonatorsByFundId,
  getTrendingFunds,
  deleteMyFund,
  closeMyFund,
} = require("../../controllers/fundController");
const { submitFundReport } = require("../../controllers/fundReportController");
const router = express.Router();

router.post(
  "/create-fundraise",
  checkForAuthenticationCookie("token"),
  upload.single("coverImage"),
  handleCreateFund
);
router.post(
  "/fund-report",
  checkForAuthenticationCookie("token"),
  upload.single("image"),
  submitFundReport
);
router.get("/fund-list", getAllFunds);
router.get("/trending", getTrendingFunds);
router.get("/fund-list/:id", getFundById);
router.get("/donar-by-fundId/:fundId", getDonatorsByFundId);

router.put(
  "/fund-list/:id/close",
  checkForAuthenticationCookie("token"),
  closeMyFund
);

router.delete(
  "/fund-list/:id",
  checkForAuthenticationCookie("token"),
  deleteMyFund
);

module.exports = router;
