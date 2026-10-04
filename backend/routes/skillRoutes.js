const express = require("express");
const router = express.Router();
const Skill = require("../models/Skill");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/skills
// @desc    Create a new skill listing (offered or wanted)
router.post("/", protect, async (req, res) => {
  try {
    const { title, category, description, type, level, mode } = req.body;
    const skill = await Skill.create({
      user: req.user._id,
      title,
      category,
      description,
      type,
      level,
      mode,
    });
    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({ message: "Could not create skill listing", error: err.message });
  }
});

// @route   GET /api/skills
// @desc    Get all skills, with optional search/filter query params
//          ?keyword=&category=&type=&mode=
router.get("/", async (req, res) => {
  try {
    const { keyword, category, type, mode } = req.query;
    const filter = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (mode) filter.mode = mode;

    const skills = await Skill.find(filter)
      .populate("user", "name location rating ratingCount")
      .sort({ createdAt: -1 });

    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch skills", error: err.message });
  }
});

// @route   GET /api/skills/mine
// @desc    Get the logged-in user's own skill listings
router.get("/mine", protect, async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch your skills", error: err.message });
  }
});

// @route   PUT /api/skills/:id
// @desc    Update a skill listing (only the owner can edit)
router.put("/:id", protect, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: "Skill listing not found" });
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own listings" });
    }

    Object.assign(skill, req.body);
    await skill.save();
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: "Could not update skill listing", error: err.message });
  }
});

// @route   DELETE /api/skills/:id
// @desc    Delete a skill listing (only the owner can delete)
router.delete("/:id", protect, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: "Skill listing not found" });
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    await skill.deleteOne();
    res.json({ message: "Skill listing deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete skill listing", error: err.message });
  }
});

module.exports = router;
