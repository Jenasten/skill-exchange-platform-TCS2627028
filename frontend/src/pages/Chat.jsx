import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

let socket;

const Chat = () => {
  const { otherUserId } = useParams();
  const { user } = useAuth();

  // ================= CHAT =================

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // ================= CALL =================

  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnection = useRef(null);
  const localStream = useRef(null);

  // Stores ICE candidates that arrive before
  // the remote description is ready.
  const pendingCandidates = useRef([]);

  const rtcConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  // ================= SOCKET CONNECTION =================

  useEffect(() => {
    socket = io(
      process.env.REACT_APP_SOCKET_URL || "http://localhost:5000"
    );

    socket.emit("join", user._id);

    // ---------- TEXT MESSAGE ----------

    socket.on("receiveMessage", (msg) => {
      const involvesThisChat =
        (msg.sender === user._id && msg.receiver === otherUserId) ||
        (msg.sender === otherUserId && msg.receiver === user._id);

      if (involvesThisChat) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // ---------- INCOMING CALL ----------

    socket.on("incomingCall", (data) => {
      if (data.callerId !== user._id) {
        setIncomingCall(data);
      }
    });

    // ---------- CALL ANSWER ----------

    socket.on("callAccepted", async (data) => {
      try {
        if (!peerConnection.current || !data.answer) return;

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

        await addPendingCandidates();

        setIsCalling(false);
        setIsInCall(true);
      } catch (error) {
        console.error("Error processing call answer:", error);
      }
    });

    // ---------- ICE CANDIDATE ----------

    socket.on("receiveIceCandidate", async (candidate) => {
      try {
        if (!peerConnection.current) return;

        if (
          peerConnection.current.remoteDescription &&
          peerConnection.current.remoteDescription.type
        ) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (error) {
        console.error("ICE candidate error:", error);
      }
    });

    // ---------- CALL REJECTED ----------

    socket.on("callRejected", () => {
      alert("The other user rejected the call.");
      endCall(false);
    });

    // ---------- CALL ENDED ----------

    socket.on("callEnded", () => {
      endCall(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [otherUserId, user._id]);

  // ================= LOAD MESSAGES =================

  useEffect(() => {
    api
      .get(`/messages/${otherUserId}`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => {
        console.error("Error loading messages:", err);
      });
  }, [otherUserId]);

  // ================= AUTO SCROLL =================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ================= SEND MESSAGE =================

  const sendMessage = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    socket.emit("sendMessage", {
      sender: user._id,
      receiver: otherUserId,
      content: text,
    });

    setText("");
  };

  // ================= CREATE PEER CONNECTION =================

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("sendIceCandidate", {
          receiverId: otherUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(
        "WebRTC connection:",
        pc.connectionState
      );

      if (pc.connectionState === "failed") {
        console.error("WebRTC connection failed.");
      }
    };

    return pc;
  };

  // ================= PENDING ICE CANDIDATES =================

  const addPendingCandidates = async () => {
    if (!peerConnection.current) return;

    for (const candidate of pendingCandidates.current) {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          "Could not add pending ICE candidate:",
          error
        );
      }
    }

    pendingCandidates.current = [];
  };

  // ================= START CALL =================

  const startCall = async (type) => {
    try {
      setCallType(type);
      setIsCalling(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });

      localStream.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current =
        createPeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(
          track,
          stream
        );
      });

      const offer =
        await peerConnection.current.createOffer();

      await peerConnection.current.setLocalDescription(
        offer
      );

      socket.emit("callUser", {
        receiverId: otherUserId,
        callerId: user._id,
        callerName: user.name,
        callType: type,
        offer,
      });
    } catch (error) {
      console.error(
        "Could not start call:",
        error
      );

      alert(
        "Could not access your microphone/camera. Please allow permission and try again."
      );

      endCall(false);
    }
  };

  // ================= ACCEPT CALL =================

  const acceptCall = async () => {
    try {
      const call = incomingCall;

      if (!call) return;

      setIncomingCall(null);
      setCallType(call.callType);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: call.callType === "video",
        });

      localStream.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current =
        createPeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(
          track,
          stream
        );
      });

      // Set caller's offer
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(call.offer)
      );

      // Add ICE candidates received before offer
      await addPendingCandidates();

      // Create answer
      const answer =
        await peerConnection.current.createAnswer();

      await peerConnection.current.setLocalDescription(
        answer
      );

      // Send answer back to caller
      socket.emit("sendAnswer", {
        callerId: call.callerId,
        answer,
      });

      setIsInCall(true);
    } catch (error) {
      console.error(
        "Could not accept call:",
        error
      );

      alert(
        "Could not access your microphone/camera."
      );

      endCall(false);
    }
  };

  // ================= REJECT CALL =================

  const rejectCall = () => {
    if (!incomingCall) return;

    socket.emit("rejectCall", {
      callerId: incomingCall.callerId,
    });

    setIncomingCall(null);
  };

  // ================= MUTE =================

  const toggleMute = () => {
    if (!localStream.current) return;

    const audioTrack =
      localStream.current.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  // ================= END CALL =================

  const endCall = (notifyOtherUser = true) => {
    if (notifyOtherUser && socket) {
      socket.emit("endCall", {
        receiverId: otherUserId,
      });
    }

    if (localStream.current) {
      localStream.current
        .getTracks()
        .forEach((track) => track.stop());

      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    pendingCandidates.current = [];

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallType(null);
    setIsCalling(false);
    setIsInCall(false);
    setIsMuted(false);
  };

  // ================= UI =================

  return (
    <div>
      <h2>Chat</h2>

      {/* ================= CALL BUTTONS ================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => startCall("audio")}
          disabled={isCalling || isInCall}
        >
          📞 Voice Call
        </button>

        <button
          className="btn btn-primary"
          onClick={() => startCall("video")}
          disabled={isCalling || isInCall}
        >
          🎥 Video Call
        </button>
      </div>

      {/* ================= INCOMING CALL ================= */}

      {incomingCall && (
        <div
          style={{
            padding: "20px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            background: "#f5f5f5",
          }}
        >
          <h3>
            📞 Incoming{" "}
            {incomingCall.callType === "video"
              ? "Video"
              : "Voice"}{" "}
            Call
          </h3>

          <p>
            <strong>
              {incomingCall.callerName}
            </strong>{" "}
            is calling you.
          </p>

          <button
            className="btn btn-primary"
            onClick={acceptCall}
            style={{ marginRight: "10px" }}
          >
            Accept
          </button>

          <button
            className="btn"
            onClick={rejectCall}
          >
            Reject
          </button>
        </div>
      )}

      {/* ================= CALL WINDOW ================= */}

      {(isCalling || isInCall) && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h3>
            {callType === "video"
              ? "🎥 Video Call"
              : "📞 Voice Call"}
          </h3>

          {isCalling && (
            <p>
              Calling... Waiting for the other user
              to answer.
            </p>
          )}

          {/* Remote video */}

          {callType === "video" && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxWidth: "600px",
                borderRadius: "10px",
                background: "#000",
              }}
            />
          )}

          {/* Local video */}

          {callType === "video" && (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "180px",
                borderRadius: "10px",
                marginTop: "10px",
                background: "#000",
              }}
            />
          )}

          {/* Controls */}

          <div
            style={{
              marginTop: "15px",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              className="btn"
              onClick={toggleMute}
            >
              {isMuted
                ? "🔇 Unmute"
                : "🎤 Mute"}
            </button>

            <button
              className="btn"
              onClick={() => endCall(true)}
            >
              ❌ End Call
            </button>
          </div>
        </div>
      )}

      {/* ================= CHAT WINDOW ================= */}

      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m._id || m.createdAt}
              className={`chat-bubble ${
                m.sender === user._id
                  ? "mine"
                  : "theirs"
              }`}
            >
              {m.content}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        <form
          className="chat-input-row"
          onSubmit={sendMessage}
        >
          <input
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            placeholder="Type a message..."
          />

          <button
            className="btn btn-primary"
            type="submit"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;