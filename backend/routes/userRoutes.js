const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// @route   GET /api/users/me
// @desc    Get the logged-in user's own profile
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Could not fetch current user",
      error: err.message,
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get a public profile by id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Could not fetch user",
      error: err.message,
    });
  }
});

// @route   PUT /api/users/me
// @desc    Update the logged-in user's own profile
// @access  Private
router.put("/me", protect, async (req, res) => {
  try {
    const {
      name,
      bio,
      location,
      skillsOffered,
      skillsWanted,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (skillsOffered) user.skillsOffered = skillsOffered;
    if (skillsWanted) user.skillsWanted = skillsWanted;

    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Could not update profile",
      error: err.message,
    });
  }
});

module.exports = router;
