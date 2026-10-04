const express = require("express");
const router = express.Router();

const ExchangeRequest = require("../models/ExchangeRequest");
const Skill = require("../models/Skill");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/requests
// @desc    Send a learning request for a skill listing
router.post("/", protect, async (req, res) => {
  try {
    const { skillId, message, scheduledTime } = req.body;

    const skill = await Skill.findById(skillId).populate("user");

    if (!skill) {
      return res.status(404).json({
        message: "Skill listing not found",
      });
    }

    // User cannot request their own skill
    if (skill.user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot request your own listing",
      });
    }

    // Set lesson cost according to skill level
    let lessonCost;

    if (skill.level === "beginner") {
      lessonCost = 5;
    } else if (skill.level === "intermediate") {
      lessonCost = 10;
    } else if (skill.level === "advanced") {
      lessonCost = 15;
    } else {
      lessonCost = 5;
    }

    const request = await ExchangeRequest.create({
      requester: req.user._id,
      provider: skill.user._id,
      skill: skill._id,
      message,
      scheduledTime,
      creditsAgreed: lessonCost,
    });

    sendEmail({
      to: skill.user.email,
      subject: "New skill learning request",
      text: `${req.user.name} has requested to learn "${skill.title}". Log in to accept or decline.`,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);

    res.status(500).json({
      message: "Could not create request",
      error: err.message,
    });
  }
});

// @route   GET /api/requests/mine
// @desc    Get requests where user is requester or provider
router.get("/mine", protect, async (req, res) => {
  try {
    const requests = await ExchangeRequest.find({
      $or: [
        { requester: req.user._id },
        { provider: req.user._id },
      ],
    })
      .populate("requester", "name email")
      .populate("provider", "name email")
      .populate("skill", "title category level")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("GET REQUESTS ERROR:", err);

    res.status(500).json({
      message: "Could not fetch requests",
      error: err.message,
    });
  }
});

// @route   PUT /api/requests/:id/status
// @desc    Update request status
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "accepted",
      "rejected",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid request status",
      });
    }

    const request = await ExchangeRequest.findById(req.params.id)
      .populate("requester")
      .populate("provider");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const isProvider =
      request.provider._id.toString() === req.user._id.toString();

    const isRequester =
      request.requester._id.toString() === req.user._id.toString();

    if (!isProvider && !isRequester) {
      return res.status(403).json({
        message: "You are not part of this exchange",
      });
    }

    // Only provider can accept or reject
    if (
      ["accepted", "rejected"].includes(status) &&
      !isProvider
    ) {
      return res.status(403).json({
        message: "Only the provider can accept or reject",
      });
    }

    // Cannot modify an already completed request
    if (request.status === "completed") {
      return res.status(400).json({
        message: "This exchange has already been completed",
      });
    }

    // A request must be accepted before it can be completed
    if (
      status === "completed" &&
      request.status !== "accepted"
    ) {
      return res.status(400).json({
        message: "Only an accepted request can be completed",
      });
    }

    // Complete session and transfer credits
    if (status === "completed") {
      const requester = await User.findById(request.requester._id);
      const provider = await User.findById(request.provider._id);

      if (!requester || !provider) {
        return res.status(404).json({
          message: "User involved in exchange not found",
        });
      }

      const credits = request.creditsAgreed || 5;

      // Check learner has enough credits
      if (requester.creditsBalance < credits) {
        return res.status(400).json({
          message: `Insufficient credits. You need ${credits} credits.`,
        });
      }

      // Learner spends credits
      requester.creditsBalance -= credits;

      // Teacher earns credits
      provider.creditsBalance += credits;

      await requester.save();
      await provider.save();

      // Mark completed only after successful credit transfer
      request.status = "completed";
    } else {
      request.status = status;
    }

    await request.save();

    sendEmail({
      to: isProvider
        ? request.requester.email
        : request.provider.email,
      subject: `Skill exchange request ${status}`,
      text: `Your skill exchange request has been marked as "${status}".`,
    });

    res.json(request);
  } catch (err) {
    console.error("REQUEST STATUS ERROR:", err);

    res.status(500).json({
      message: "Could not update request status",
      error: err.message,
    });
  }
});

module.exports = router;
