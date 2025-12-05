const { sendFundStatusEmailToUser, sendThankYouEmailToDonor } = require("../emailService/emailService"); // ✅ UPDATED
const CreateFund = require("../models/createFundModel");
const Donator = require("../models/donatorModel"); // ✅ ADD

const getPendingFunds = async (req, res) => {
  try {
    const pendingFunds = await CreateFund.find({ isApproved: false }).populate("userId");
    res.status(200).json({ pendingFunds });
  } catch (error) {
    res.status(500).json({ msg: "Server error while fetching pending funds" });
  }
};

const approveFund = async (req, res) => {
  try {
    const fundId = req.params.id;
    const fund = await CreateFund.findByIdAndUpdate(
      fundId,
      { isApproved: true },
      { new: true }
    ).populate("userId");

    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }

      await sendFundStatusEmailToUser({
      fund,
      user: fund.userId,
      status: "Approved",
    });


    res.status(200).json({ msg: "Fund approved successfully", fund });
  } catch (error) {
    res.status(500).json({ msg: "Server error while approving fund" });
  }
};


const rejectFund = async (req, res) => {
  try {
    const fundId = req.params.id;


    const fund = await CreateFund.findByIdAndDelete(fundId).populate("userId");

    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }

   await sendFundStatusEmailToUser({
      fund,
      user: fund.userId,
      status: "Rejected",
    });

    res.status(200).json({ msg: "Fund rejected successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error while rejecting fund" });
  }
};

// ✅ ADD THESE 3 NEW FUNCTIONS

// Get all pending (unverified) donations
const getPendingDonations = async (req, res) => {
  try {
    const pendingDonations = await Donator.find({ isVerified: false })
      .populate("fundId", "fundraiseTitle")
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ pendingDonations });
  } catch (error) {
    console.error("Error fetching pending donations:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Verify a donation
const verifyDonation = async (req, res) => {
  try {
    const donationId = req.params.id;
    const adminId = req.user.id;

    const donation = await Donator.findById(donationId).populate("fundId");
    if (!donation) {
      return res.status(404).json({ msg: "Donation not found" });
    }

    if (donation.isVerified) {
      return res.status(400).json({ msg: "Donation already verified" });
    }

    // Mark as verified
    donation.isVerified = true;
    donation.verifiedAt = new Date();
    donation.verifiedBy = adminId;
    await donation.save();

    // Update fund amount
    const fund = donation.fundId;
    fund.donationAmount += parseFloat(donation.amount);
    fund.donationCount += 1;
    await fund.save();

    // Send thank you email to donor
    await sendThankYouEmailToDonor({ donor: donation, fund });

    res.status(200).json({ 
      msg: "Donation verified successfully", 
      donation,
      updatedFund: fund 
    });
  } catch (error) {
    console.error("Error verifying donation:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Reject a donation
const rejectDonation = async (req, res) => {
  try {
    const donationId = req.params.id;

    const donation = await Donator.findByIdAndDelete(donationId).populate("fundId");
    if (!donation) {
      return res.status(404).json({ msg: "Donation not found" });
    }

    // Remove from fund's donators array
    await CreateFund.findByIdAndUpdate(donation.fundId._id, {
      $pull: { donators: donationId }
    });

    res.status(200).json({ msg: "Donation rejected and removed" });
  } catch (error) {
    console.error("Error rejecting donation:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  getPendingFunds,
  approveFund,
  rejectFund,
  getPendingDonations,  // ✅ ADD
  verifyDonation,       // ✅ ADD
  rejectDonation,       // ✅ ADD
};
