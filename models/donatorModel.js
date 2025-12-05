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
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    donatedAt: {
      type: Date,
      default: Date.now,
    },
    proofImage: {
      type: String,
      required: true,
    },
    // ✅ ADD THESE 3 NEW FIELDS
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
