const CreateFund = require("../models/createFundModel");
const DeletionRequest = require("../models/deletionModel");
const Donator = require("../models/donatorModel");
const User = require("../models/userModel");
const { cascadeDeleteFund } = require("./fundController");
const {
  deleteCloudinaryImage,
  deleteCloudinaryImages,
} = require("../config/cloudinary/deleteImage");

const handleRequestDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const existingRequest = await DeletionRequest.findOne({
      userId: user._id,
      status: "pending",
    });
    if (existingRequest)
      return res.status(400).json({ msg: "Deletion request already pending" });

    const deletionReq = new DeletionRequest({
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
    });

    await deletionReq.save();
    res.status(201).json({ msg: "Deletion request submitted successfully" });
  } catch (error) {
    console.error("Error submitting deletion request:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const getAllPendingDeletions = async (req, res) => {
  try {
    const pendingRequests = await DeletionRequest.find({ status: "pending" })
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const userId = request.userId?._id;

        const donatedFunds = await Donator.find({ userId })
          .populate("fundId", "fundraiseTitle donationAmount")
          .lean();

        const createdFunds = await CreateFund.find({ userId })
          .select("fundraiseTitle donationAmount totalAmountRaised status")
          .lean();

        return {
          ...request._doc,
          fullName: request.userId?.fullName || request.fullName,
          email: request.userId?.email || request.email,
          donatedFunds,
          createdFunds,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedRequests.length,
      requests: enrichedRequests,
    });
  } catch (error) {
    console.error("Error fetching pending deletions:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Approving a deletion request cascades: it removes the user, every fundraiser
// they created (and that fund's donations/images), every donation they made
// (adjusting the affected campaign totals), and their profile/CNIC images.
const handleApproveDeletion = async (req, res) => {
  try {
    const request = await DeletionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ msg: "pending request not found" });
    }

    const user = await User.findById(request.userId);
    if (!user) {
      // User already gone — just close out the request.
      request.status = "approved";
      await request.save();
      return res.status(200).json({ msg: "User already deleted." });
    }

    const createdFunds = await CreateFund.find({ userId: user._id });
    const donations = await Donator.find({ userId: user._id }).populate(
      "fundId",
      "fundraiseTitle"
    );

    // Snapshot for the audit log before anything is removed.
    request.donatedFunds = donations.map((d) => ({
      fundTitle: d.fundId?.fundraiseTitle || "Unknown",
      amount: d.amount,
      donatedAt: d.createdAt,
    }));
    request.createdFunds = createdFunds.map((f) => ({
      fundraiseTitle: f.fundraiseTitle,
      fundCategory: f.fundCategory,
      totalAmountRaised: f.totalAmountRaised,
      createdAt: f.createdAt,
      isApproved: f.isApproved,
    }));
    request.status = "approved";
    await request.save();

    const createdFundIds = new Set(createdFunds.map((f) => f._id.toString()));

    // 1) Remove every fundraiser the user created (with its own cascade).
    for (const fund of createdFunds) {
      await cascadeDeleteFund(fund);
    }

    // 2) Remove the user's donations to OTHER people's funds, adjusting totals.
    for (const donation of donations) {
      const fundId = donation.fundId?._id || donation.fundId;
      if (fundId && !createdFundIds.has(fundId.toString())) {
        if (donation.isVerified) {
          await CreateFund.findByIdAndUpdate(fundId, {
            $inc: { donationAmount: -Number(donation.amount), donationCount: -1 },
            $pull: { donators: donation._id },
          });
        } else {
          await CreateFund.findByIdAndUpdate(fundId, {
            $pull: { donators: donation._id },
          });
        }
        await deleteCloudinaryImage(donation.proofImage);
      }
    }
    await Donator.deleteMany({ userId: user._id });

    // 3) Remove the user's own uploaded images, then the user.
    await deleteCloudinaryImages([user.profilePhoto, user.cnicImage]);
    await User.findByIdAndDelete(user._id);

    res
      .status(200)
      .json({ msg: "User and all associated data deleted successfully." });
  } catch (err) {
    console.error("Error approving deletion:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const handleRejectDeletion = async (req, res) => {
  try {
    const request = await DeletionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ msg: "Pending request not found" });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ msg: "Deletion request rejected." });
  } catch (err) {
    console.error("Error rejecting deletion:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  handleRequestDeletion,
  getAllPendingDeletions,
  handleApproveDeletion,
  handleRejectDeletion,
};
