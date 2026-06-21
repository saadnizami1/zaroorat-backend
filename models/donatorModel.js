const mongoose = require("mongoose");

const donatorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    fundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreateFund",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Donation amount must be greater than zero"],
    },
    donatedAt: {
      type: Date,
      default: Date.now,
    },
    proofImage: {
      type: String,
      required: true,
    },
    // Donations start unverified; an admin verifies the uploaded proof of
    // payment before the amount is credited to the campaign total.
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const Donator = mongoose.model("Donator", donatorSchema);

module.exports = Donator;