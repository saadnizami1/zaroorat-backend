const { sendDonationNotificationToAdmin, sendThankYouEmailToDonor } = require("../emailService/emailService");
const CreateFund = require("../models/createFundModel");
const Donator = require("../models/donatorModel");

const donateAmount = async (req, res) => {
  try {
    const { fundId, amount, fullName, email, contactNumber } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!fundId || !amount || !fullName || !email || !contactNumber) {
      return res.status(400).json({ msg: "All fields are required" });
    }
     
    if (!req.file) {
      return res.status(400).json({ msg: "Proof of donation image is required" });
    }

    const proofImage = req.file.path;

    const fund = await CreateFund.findById(fundId);
    if (!fund) return res.status(404).json({ msg: "Fund not found" });

    const newDonor = new Donator({
      userId,
      fundId,
      fullName,
      email,
      contactNumber,
      amount,
      proofImage,
      isVerified: false,  // ✅ ADD: Mark as unverified
    });

    await newDonor.save();

    fund.donators.push(newDonor._id);
    // ❌ REMOVED: fund.donationAmount += parseFloat(amount);
    // ❌ REMOVED: fund.donationCount += 1;
    await fund.save();

    // Send notification to admin for verification
    await sendDonationNotificationToAdmin({ donor: newDonor, fund });
    // ❌ REMOVED: await sendThankYouEmailToDonor({ donor: newDonor, fund });
    // Thank you email will be sent AFTER admin verification

    res.status(201).json({
      msg: "Thank you for your donation! Your contribution will be reflected on the campaign after our team verifies the payment.", // ✅ UPDATED MESSAGE
      donor: newDonor,
    });
  } catch (error) {
    console.error("Error donating amount:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { donateAmount };
