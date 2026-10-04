const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const User = require("../models/User");
const ExchangeRequest = require("../models/ExchangeRequest");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/reviews
// @desc    Leave a review for a completed exchange
router.post("/", protect, async (req, res) => {
  try {
    const { exchangeId, revieweeId, rating, comment } = req.body;

    const exchange = await ExchangeRequest.findById(exchangeId);
    if (!exchange || exchange.status !== "completed") {
      return res.status(400).json({ message: "You can only review completed exchanges" });
    }

    const review = await Review.create({
      exchange: exchangeId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment,
    });

    // Recalculate the reviewee's average rating
    const reviewee = await User.findById(revieweeId);
    const newCount = reviewee.ratingCount + 1;
    const newAverage = (reviewee.rating * reviewee.ratingCount + rating) / newCount;
    reviewee.rating = newAverage;
    reviewee.ratingCount = newCount;
    await reviewee.save();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Could not submit review", error: err.message });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews received by a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch reviews", error: err.message });
  }
});

module.exports = router;
