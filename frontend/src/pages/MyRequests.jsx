import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests/mine");
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      alert(
        error.response?.data?.message ||
          "Could not load exchange requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/requests/${id}/status`, { status });
      await fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);

      alert(
        error.response?.data?.message ||
          "You are not authorized to perform this action."
      );
    }
  };

  if (loading) {
    return <p>Loading requests...</p>;
  }

  return (
    <div>
      <h2>My exchange requests</h2>

      {requests.length === 0 ? (
        <p className="empty-state">
          No requests yet — go browse skills and request an exchange.
        </p>
      ) : (
        <div className="grid">
          {requests.map((r) => {
            if (!r.provider || !r.requester) {
              return null;
            }

            const providerId = r.provider._id?.toString();
            const userId = user?._id?.toString();

            const isProvider = providerId === userId;

            const otherUser = isProvider
              ? r.requester
              : r.provider;

            return (
              <div className="card" key={r._id}>
                <h3>{r.skill?.title || "Skill"}</h3>

                <p style={{ fontSize: "0.9rem" }}>
                  {isProvider
                    ? "Requested by"
                    : "Requested to"}{" "}
                  <strong>{otherUser?.name}</strong>
                </p>

                <p
                  className={`status-${r.status}`}
                  style={{ fontWeight: 600 }}
                >
                  {r.status.toUpperCase()}
                </p>

                <p>
                  <strong>Lesson Cost:</strong>{" "}
                  {r.creditsAgreed || 5} Credits
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  {/* PROVIDER ACTIONS */}

                  {isProvider && r.status === "pending" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          updateStatus(
                            r._id,
                            "accepted"
                          )
                        }
                      >
                        Accept
                      </button>

                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          updateStatus(
                            r._id,
                            "rejected"
                          )
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* COMPLETE */}

                  {r.status === "accepted" && (
                    <button
                      className="btn btn-accent"
                      onClick={() =>
                        updateStatus(
                          r._id,
                          "completed"
                        )
                      }
                    >
                      Mark completed
                    </button>
                  )}

                  {/* CANCEL */}

                  {["pending", "accepted"].includes(
                    r.status
                  ) && (
                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        updateStatus(
                          r._id,
                          "cancelled"
                        )
                      }
                    >
                      Cancel
                    </button>
                  )}

                  {/* CHAT */}

                  {otherUser?._id && (
                    <Link
                      className="btn btn-outline"
                      to={`/chat/${otherUser._id}`}
                    >
                      Message
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
