const {
  sendFundApprovalMailToAdmin,
  sendFundCreationMailToUser,
} = require("../emailService/emailService");
const CreateFund = require("../models/createFundModel");
const Donator = require("../models/donatorModel");
const fundReport = require("../models/fundReport");
const User = require("../models/userModel");
const { deleteCloudinaryImages } = require("../config/cloudinary/deleteImage");

const MIN_GOAL = 500;

/**
 * Remove a fund and everything attached to it: its donations, the donation
 * proof images, the report images, and the cover image. Best-effort on images.
 */
const cascadeDeleteFund = async (fund) => {
  const donations = await Donator.find({ fundId: fund._id }).select("proofImage");
  const reports = await fundReport.find({ fundId: fund._id }).select("image");

  await Donator.deleteMany({ fundId: fund._id });
  await fundReport.deleteMany({ fundId: fund._id });
  await CreateFund.findByIdAndDelete(fund._id);

  await deleteCloudinaryImages([
    fund.coverImage,
    ...donations.map((d) => d.proofImage),
    ...reports.map((r) => r.image),
  ]);
};

const handleCreateFund = async (req, res) => {
  try {
    const {
      country,
      postcode,
      fundCategory,
      fundraiseTitle,
      fundraiseStory,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      bankCode,
      totalAmountRaised,
    } = req.body;
    if (!req.user) return res.status(401).json({ msg: "Unauthorized" });
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { fullName, email, cnicImage, cityName, phone } = user;

    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !cnicImage?.trim() ||
      !cityName?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        msg: "Please complete your profile before creating a fund. Required fields: fullName, email, CNIC image, city, phone.",
      });
    }

    if (
      !country ||
      !postcode ||
      !fundCategory ||
      !fundraiseTitle ||
      !fundraiseStory ||
      !totalAmountRaised
    ) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    // Goal amount must be a valid number at or above the minimum.
    const goal = Number(totalAmountRaised);
    if (!Number.isFinite(goal) || goal < MIN_GOAL) {
      return res
        .status(400)
        .json({ msg: `Goal amount must be a number of at least ${MIN_GOAL} PKR` });
    }

    // Payout details are required so the platform can disburse raised funds.
    if (!accountHolderName?.trim() || !accountNumber?.trim() || !bankName?.trim()) {
      return res.status(400).json({
        msg: "Please provide your payout bank details (account holder name, account number, and bank name).",
      });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "A cover image is required" });
    }
    const coverImage = req.file.path;

    const newFund = new CreateFund({
      userId,
      country,
      postcode,
      fundCategory,
      fundraiseTitle,
      fundraiseStory,
      donationAmount: 0,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankCode,
      bankName,
      upiId,
      coverImage,
      isApproved: false,
      status: "pending",
      totalAmountRaised: goal,
    });

    await newFund.save();

    await Promise.all([
      sendFundApprovalMailToAdmin({
        fund: newFund,
        user: {
          name: req.user.fullName,
          email: req.user.email,
        },
      }),
      sendFundCreationMailToUser({
        fund: newFund,
        user: {
          name: req.user.fullName,
          email: req.user.email,
        },
      }),
    ]);

    res.status(201).json({
      msg: "Fundraising created successfully!",
      fund: newFund,
    });
  } catch (error) {
    console.error("Error creating fund:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const getAllFunds = async (req, res) => {
  try {
    const { search } = req.query;

    // Public = approved and not paused/closed. The status check tolerates
    // legacy campaigns created before the status field existed.
    const filter = { isApproved: true, status: { $nin: ["paused", "closed"] } };

    if (search) {
      filter.$or = [
        { fundCategory: { $regex: search, $options: "i" } },
        { fundraiseTitle: { $regex: search, $options: "i" } },
      ];
    }

    const funds = await CreateFund.find(filter)
      .populate("userId", "fullName profilePhoto cityName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: funds.length,
      funds: funds,
    });
  } catch (error) {
    console.error("Error fetching funds:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const getTrendingFunds = async (req, res) => {
  try {
    // Trending = live campaigns with the most raised so far.
    const trendingFunds = await CreateFund.find({
      isApproved: true,
      status: { $nin: ["paused", "closed"] },
      donationAmount: { $gt: 0 },
    })
      .populate("userId", "fullName profilePhoto cityName")
      .sort({ donationAmount: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      count: trendingFunds.length,
      trendingFunds,
    });
  } catch (error) {
    console.error("Error fetching trending funds:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const getFundById = async (req, res) => {
  const { id } = req.params;

  try {
    const fund = await CreateFund.findOne({
      _id: id,
      isApproved: true,
      status: { $nin: ["paused", "closed"] },
    }).populate("userId", "fullName profilePhoto cityName");

    if (!fund) {
      return res.status(404).json({ msg: "Fund not found or not available" });
    }

    const reports = await fundReport
      .find({ fundId: id })
      .sort({ createdAt: -1 })
      .select("description image createdAt");

    res.status(200).json({
      success: true,
      fund: fund,
      reports,
    });
  } catch (error) {
    console.error("Error fetching fund by ID:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Public list of supporters for a fund. Only verified donations are shown,
// and only non-sensitive fields — no email, phone, or payment proof.
const getDonatorsByFundId = async (req, res) => {
  const { fundId } = req.params;

  try {
    const donators = await Donator.find({ fundId, isVerified: true })
      .select("fullName amount donatedAt createdAt")
      .sort({ createdAt: -1 });

    const publicDonators = donators.map((d) => ({
      fullName: d.fullName,
      amount: d.amount,
      donatedAt: d.donatedAt || d.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: publicDonators.length,
      donators: publicDonators,
    });
  } catch (error) {
    console.error("Error fetching donators by fund ID:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteMyFund = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const fund = await CreateFund.findById(id);

    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }

    if (fund.userId.toString() !== userId) {
      return res.status(403).json({ msg: "Unauthorized to delete this fund" });
    }

    await cascadeDeleteFund(fund);
    res.status(200).json({ success: true, msg: "Fund deleted successfully" });
  } catch (error) {
    console.error("Error deleting fund:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Owner closes/withdraws their own campaign without deleting its records.
const closeMyFund = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const fund = await CreateFund.findById(id);
    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }
    if (fund.userId.toString() !== userId) {
      return res.status(403).json({ msg: "Unauthorized to close this fund" });
    }
    if (fund.status === "closed") {
      return res.status(400).json({ msg: "Fund is already closed" });
    }

    fund.status = "closed";
    fund.closedAt = new Date();
    await fund.save();

    res.status(200).json({ success: true, msg: "Fund closed successfully", fund });
  } catch (error) {
    console.error("Error closing fund:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const adminDeleteFund = async (req, res) => {
  const { id } = req.params;

  try {
    const fund = await CreateFund.findById(id);
    if (!fund) {
      return res.status(404).json({ msg: "Fund not found" });
    }

    await cascadeDeleteFund(fund);
    res
      .status(200)
      .json({ success: true, msg: "Fund deleted by admin successfully" });
  } catch (error) {
    console.error("Admin delete fund error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  handleCreateFund,
  getAllFunds,
  getFundById,
  getDonatorsByFundId,
  getTrendingFunds,
  deleteMyFund,
  closeMyFund,
  adminDeleteFund,
  cascadeDeleteFund,
};
