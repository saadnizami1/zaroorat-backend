const mongoose = require("mongoose");

const createFundSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      trim: true,
    },
    postcode: {
      type: String,
      required: true,
      trim: true,
    },
    fundCategory: {
      type: String,
      enum: [
        "animal",
        "business",
        "community",
        "competition",
        "creative",
        "education",
        "emergencies",
        "environment",
        "events",
        "faith",
        "family",
        "funerals_memorials",
        "medical",
        "monthly_bills",
        "newly_weds",
        "other",
        "sports",
        "travel",
        "ukraine_relief",
        "volunteer",
        "wishes",
        "gaza",
        "kashmir",
        "Islamic_causes"
      ],
      required: true,
    },

    fundraiseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    fundraiseStory: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    accountHolderName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
    },
    bankCode: {
      type: String,
      trim: true,
    },

    bankName: {
      type: String,
      trim: true,
    },

    upiId: {
      type: String,
      trim: true,
    },

    qrCodeImage: {
      type: String,
    },
     coverImage: {
      type: String,
    },
     cnicImage: {
      type: String,
    },
    donationAmount: {
      type: Number,
      default: 0,
    },
      phone: {
      type: String,
       default: null,
    },
    fullName: {
      type: String,
    },
    cityName: {
      type: String,
    },
     email: {
      type: String,
    },
     donationCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },

    // Lifecycle:
    //  pending  – awaiting admin approval (not public)
    //  active   – approved & live (public, accepting donations)
    //  paused   – suspended by admin (not public, e.g. suspected fraud)
    //  closed   – closed/withdrawn by the owner (not public)
    status: {
      type: String,
      enum: ["pending", "active", "paused", "closed"],
      default: "pending",
    },
    closedAt: {
      type: Date,
    },
    pausedReason: {
      type: String,
    },

    // Target/goal amount for the campaign (not the amount raised).
    totalAmountRaised: {
      type: Number,
      min: 500,
    },
    donators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donator",
      },
    ],
  },
  { timestamps: true }
);

const CreateFund = mongoose.model("CreateFund", createFundSchema);

module.exports = CreateFund;
