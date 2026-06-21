const {
  sendFundStatusEmailToUser,
  sendThankYouEmailToDonor,
} = require("../emailService/emailService");
const CreateFund = require("../models/createFundModel");
const Donator = require("../models/donatorModel");
const { cascadeDeleteFund } = require("./fundController");
const { deleteCloudinaryImage } = require("../config/cloudinary/deleteImage");

const getPendingFunds = async (req, res) => {
  try {
    const pendingFunds = await CreateFund.find({ status: "pending" }).populate(
      "userId"
    );
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
      { isApproved: true, status: "active" },
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

    const fund = await CreateFund.findById(fundId).populate("userId");
    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }

    const user = fund.userId;
    await cascadeDeleteFund(fund);

    await sendFundStatusEmailToUser({
      fund,
      user,
      status: "Rejected",
    });

    res.status(200).json({ msg: "Fund rejected successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error while rejecting fund" });
  }
};

// Live + paused campaigns for the admin management view.
const getManagedFunds = async (req, res) => {
  try {
    const funds = await CreateFund.find({ status: { $in: ["active", "paused"] } })
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json({ funds });
  } catch (error) {
    console.error("Error fetching managed funds:", error);
    res.status(500).json({ msg: "Server error while fetching managed funds" });
  }
};

// Admin suspends a live campaign (e.g. suspected fraud) without deleting it.
const pauseFund = async (req, res) => {
  try {
    const fund = await CreateFund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }
    fund.status = "paused";
    if (req.body?.reason) fund.pausedReason = req.body.reason;
    await fund.save();
    res.status(200).json({ msg: "Fund paused", fund });
  } catch (error) {
    console.error("Error pausing fund:", error);
    res.status(500).json({ msg: "Server error while pausing fund" });
  }
};

const resumeFund = async (req, res) => {
  try {
    const fund = await CreateFund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }
    fund.status = "active";
    fund.isApproved = true;
    fund.pausedReason = undefined;
    await fund.save();
    res.status(200).json({ msg: "Fund resumed", fund });
  } catch (error) {
    console.error("Error resuming fund:", error);
    res.status(500).json({ msg: "Server error while resuming fund" });
  }
};

// Get all pending (unverified) donations awaiting proof verification.
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

// Verify a donation: credit the campaign total and thank the donor.
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

    const fund = donation.fundId;
    if (!fund) {
      return res
        .status(404)
        .json({ msg: "The campaign for this donation no longer exists" });
    }

    donation.isVerified = true;
    donation.verifiedAt = new Date();
    donation.verifiedBy = adminId;
    await donation.save();

    fund.donationAmount = (fund.donationAmount || 0) + Number(donation.amount);
    fund.donationCount = (fund.donationCount || 0) + 1;
    await fund.save();

    await sendThankYouEmailToDonor({ donor: donation, fund });

    res.status(200).json({
      msg: "Donation verified successfully",
      donation,
      updatedFund: fund,
    });
  } catch (error) {
    console.error("Error verifying donation:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Reject a donation: remove the record, its proof image, and the fund link.
const rejectDonation = async (req, res) => {
  try {
    const donationId = req.params.id;

    const donation = await Donator.findById(donationId);
    if (!donation) {
      return res.status(404).json({ msg: "Donation not found" });
    }
    if (donation.isVerified) {
      return res.status(400).json({
        msg: "Cannot reject a donation that has already been verified",
      });
    }

    await Donator.findByIdAndDelete(donationId);

    await CreateFund.findByIdAndUpdate(donation.fundId, {
      $pull: { donators: donationId },
    });

    await deleteCloudinaryImage(donation.proofImage);

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
  getManagedFunds,
  pauseFund,
  resumeFund,
  getPendingDonations,
  verifyDonation,
  rejectDonation,
};
