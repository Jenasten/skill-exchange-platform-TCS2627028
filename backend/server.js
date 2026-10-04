const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const connectDB = require("./config/db");
const Message = require("./models/Message");

const authRoutes = require("./routes/authRoutes");
const skillRoutes = require("./routes/skillRoutes");
const requestRoutes = require("./routes/requestRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

app.use(express.json());

// ================= REST API ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Skill Exchange Platform API is running");
});

// ================= SOCKET.IO =================

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
  },
});

// ================= REAL-TIME FEATURES =================

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ------------------------------------------------
  // JOIN USER ROOM
  // ------------------------------------------------

  socket.on("join", (userId) => {
    socket.join(userId);

    console.log(`User ${userId} joined room`);
  });

  // ------------------------------------------------
  // TEXT CHAT
  // ------------------------------------------------

  socket.on("sendMessage", async ({ sender, receiver, content }) => {
    try {
      const message = await Message.create({
        sender,
        receiver,
        content,
      });

      // Send message to receiver
      io.to(receiver).emit("receiveMessage", message);

      // Send message back to sender
      io.to(sender).emit("receiveMessage", message);
    } catch (err) {
      console.error(
        "Socket message save failed:",
        err.message
      );
    }
  });

  // =================================================
  // VOICE / VIDEO CALLING
  // =================================================

  // -------------------------------------------------
  // START CALL
  // -------------------------------------------------

  socket.on(
    "callUser",
    ({
      receiverId,
      callerId,
      callerName,
      callType,
      offer,
    }) => {
      console.log(
        `${callType} call from ${callerId} to ${receiverId}`
      );

      io.to(receiverId).emit("incomingCall", {
        callerId,
        callerName,
        callType,
        offer,
      });
    }
  );

  // -------------------------------------------------
  // ACCEPT CALL
  // -------------------------------------------------

  socket.on("acceptCall", ({ callerId }) => {
    console.log(
      `Call accepted by socket ${socket.id}`
    );

    io.to(callerId).emit("callAccepted");
  });

  // -------------------------------------------------
  // SEND WEBRTC ANSWER
  // -------------------------------------------------

  socket.on(
    "sendAnswer",
    ({ callerId, answer }) => {
      console.log(
        `Sending WebRTC answer to ${callerId}`
      );

      io.to(callerId).emit("callAccepted", {
        answer,
      });
    }
  );

  // -------------------------------------------------
  // SEND WEBRTC OFFER
  // -------------------------------------------------

  socket.on(
    "sendOffer",
    ({
      receiverId,
      callerId,
      offer,
    }) => {
      io.to(receiverId).emit("receiveOffer", {
        callerId,
        offer,
      });
    }
  );

  // -------------------------------------------------
  // ICE CANDIDATE
  // -------------------------------------------------

  socket.on(
    "sendIceCandidate",
    ({
      receiverId,
      candidate,
    }) => {
      io.to(receiverId).emit(
        "receiveIceCandidate",
        candidate
      );
    }
  );

  // -------------------------------------------------
  // REJECT CALL
  // -------------------------------------------------

  socket.on(
    "rejectCall",
    ({ callerId }) => {
      console.log(
        `Call rejected by ${socket.id}`
      );

      io.to(callerId).emit("callRejected");
    }
  );

  // -------------------------------------------------
  // END CALL
  // -------------------------------------------------

  socket.on(
    "endCall",
    ({ receiverId }) => {
      console.log(
        `Call ended. Notifying ${receiverId}`
      );

      io.to(receiverId).emit("callEnded");
    }
  );

  // -------------------------------------------------
  // DISCONNECT
  // -------------------------------------------------

  socket.on("disconnect", () => {
    console.log(
      "Socket disconnected:",
      socket.id
    );
  });
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
