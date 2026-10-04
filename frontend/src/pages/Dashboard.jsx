import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/users/me");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Could not load user information.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "30px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ margin: 0 }}>Skill Exchange</h1>

        <Link
          to="/profile"
          style={{
            textDecoration: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            background: "#222",
            color: "white",
          }}
        >
          My Profile
        </Link>
      </div>

      {/* Welcome */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Welcome, {user.name}! 👋
        </h2>

        <p style={{ marginBottom: 0 }}>
          Exchange your skills, learn from others, and earn Skill Credits.
        </p>
      </div>

      {/* Credit Card */}
      <div
        style={{
          background: "#222",
          color: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Skill Credits</h3>

        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
          }}
        >
          {user.creditsBalance}
        </div>

        <p style={{ marginBottom: 0 }}>
          Credits available for learning skills
        </p>
      </div>

      {/* Skills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Skills I Teach */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>🎓 Skills I Teach</h3>

          {user.skillsOffered && user.skillsOffered.length > 0 ? (
            <ul>
              {user.skillsOffered.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p>You haven't added any skills yet.</p>
          )}
        </div>

        {/* Skills I Want */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>📚 Skills I Want to Learn</h3>

          {user.skillsWanted && user.skillsWanted.length > 0 ? (
            <ul>
              {user.skillsWanted.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p>You haven't added any skills yet.</p>
          )}
        </div>
      </div>

      {/* Main Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        <Link
          to="/skills"
          style={{
            textDecoration: "none",
            color: "inherit",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>🔎 Find a Skill</h3>
          <p>Find people who can teach you new skills.</p>
        </Link>

        <Link
          to="/requests"
          style={{
            textDecoration: "none",
            color: "inherit",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>📩 Learning Requests</h3>
          <p>View and manage your skill exchange requests.</p>
        </Link>

        <Link
          to="/chat"
          style={{
            textDecoration: "none",
            color: "inherit",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>💬 Messages</h3>
          <p>Chat with other skill exchange users.</p>
        </Link>
      </div>

      {/* How it Works */}
      <div
        style={{
          marginTop: "40px",
          padding: "25px",
          background: "#f5f5f5",
          borderRadius: "12px",
        }}
      >
        <h2>How Skill Exchange Works</h2>

        <ol>
          <li>Teach a skill to another user.</li>
          <li>Earn Skill Credits.</li>
          <li>Use your credits to learn another skill.</li>
          <li>Complete the session.</li>
          <li>Give and receive reviews.</li>
        </ol>
      </div>
    </div>
  );
}

export default Dashboard;