const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["offered", "wanted"], required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    mode: { type: String, enum: ["online", "offline", "both"], default: "online" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
