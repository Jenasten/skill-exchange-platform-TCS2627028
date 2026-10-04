const mongoose = require("mongoose");

const exchangeRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    scheduledTime: { type: Date },
    message: { type: String, default: "" },
    creditsAgreed: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExchangeRequest", exchangeRequestSchema);
