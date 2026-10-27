const express = require("express");
const { handleContactMessage } = require("../../controllers/contactController");

const router = express.Router();

router.post("/", handleContactMessage);

module.exports = router;
