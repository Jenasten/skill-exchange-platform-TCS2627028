const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { protect } = require("../middleware/authMiddleware");

// @route   GET /api/messages/:otherUserId
// @desc    Get the full chat history between the logged-in user and another user
router.get("/:otherUserId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.otherUserId },
        { sender: req.params.otherUserId, receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch messages", error: err.message });
  }
});

// @route   POST /api/messages
// @desc    Save a chat message (also broadcast live via Socket.io in server.js)
router.post("/", protect, async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const newMessage = await Message.create({
      sender: req.user._id,
      receiver,
      content,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Could not send message", error: err.message });
  }
});

module.exports = router;
