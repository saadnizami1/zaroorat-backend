const {
  sendDonationNotificationToAdmin,
} = require("../emailService/emailService");
const CreateFund = require("../models/createFundModel");
const Donator = require("../models/donatorModel");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const donateAmount = async (req, res) => {
  try {
    const { fundId, amount, fullName, email, contactNumber } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!fundId || !amount || !fullName || !email || !contactNumber) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ msg: "Please provide a valid email address" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ msg: "Donation amount must be a number greater than zero" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ msg: "Proof of donation image is required" });
    }

    const proofImage = req.file.path;

    const fund = await CreateFund.findById(fundId);
    if (!fund) return res.status(404).json({ msg: "Fund not found" });
    if (fund.status !== "active") {
      return res
        .status(400)
        .json({ msg: "This campaign is not currently accepting donations" });
    }

    const newDonor = new Donator({
      userId,
      fundId,
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      contactNumber: String(contactNumber).trim(),
      amount: numericAmount,
      proofImage,
      isVerified: false,
    });

    await newDonor.save();

    fund.donators.push(newDonor._id);
    await fund.save();

    // Notify admin to verify the uploaded proof. The campaign total and the
    // donor thank-you email are handled only after admin verification.
    await sendDonationNotificationToAdmin({ donor: newDonor, fund });

    res.status(201).json({
      msg: "Thank you for your donation! Your contribution will be reflected on the campaign after our team verifies the payment.",
      donor: newDonor,
    });
  } catch (error) {
    console.error("Error donating amount:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { donateAmount };
