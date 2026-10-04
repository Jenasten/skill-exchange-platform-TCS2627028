import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  title: "",
  category: "",
  description: "",
  type: "offered",
  level: "beginner",
  mode: "online",
};

const Skills = () => {
  const { user } = useAuth();

  const [skills, setSkills] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const fetchSkills = async (search = "") => {
    try {
      const res = await api.get(
        `/skills${search ? `?keyword=${encodeURIComponent(search)}` : ""}`
      );

      setSkills(res.data);
    } catch (err) {
      console.error("Could not fetch skills:", err);
      setMessage("Could not load skill listings.");
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSkills(keyword);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await api.post("/skills", form);

      setForm(emptyForm);
      setShowForm(false);
      setMessage("Skill listing published successfully!");

      fetchSkills();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Could not publish skill listing."
      );
    }
  };

  const requestExchange = async (skillId) => {
    try {
      await api.post("/requests", {
        skillId,
        message: "Hi! I'd like to learn this skill from you.",
      });

      setMessage(
        "Learning request sent! Check 'My Requests' to track it."
      );
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Could not send learning request."
      );
    }
  };

  // Get lesson cost based on skill level
  const getLessonCost = (level) => {
    if (level === "beginner") return 5;
    if (level === "intermediate") return 10;
    if (level === "advanced") return 15;
    return 5;
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2>Find a Skill</h2>
          <p style={{ color: "var(--color-ink-soft)" }}>
            Find people who can teach you a skill.
          </p>
        </div>

        <button
          className="btn btn-accent"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add a skill listing"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <p style={{ color: "var(--color-primary)", marginBottom: 20 }}>
          {message}
        </p>
      )}

      {/* Add Skill Form */}
      {showForm && (
        <form
          className="card"
          onSubmit={handleCreate}
          style={{ marginBottom: 24 }}
        >
          <h3>Add a Skill</h3>

          <div className="form-group">
            <label>Skill Title</label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              placeholder="e.g. Guitar"
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              placeholder="e.g. Music, Technology, Cooking"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe what you can teach..."
              rows={3}
              required
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>I am...</label>

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
              >
                <option value="offered">
                  I can teach this skill
                </option>

                <option value="wanted">
                  I want to learn this skill
                </option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Level</label>

              <select
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: e.target.value })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Mode</label>

              <select
                value={form.mode}
                onChange={(e) =>
                  setForm({ ...form, mode: e.target.value })
                }
              >
                <option value="online">Online</option>
                <option value="offline">In person</option>
                <option value="both">Either</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            Publish Listing
          </button>
        </form>
      )}

      {/* Search */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <input
          style={{ flex: 1 }}
          placeholder="Search for a skill, e.g. Guitar, Python, Excel"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button className="btn btn-outline" type="submit">
          Search
        </button>
      </form>

      {/* Results */}
      {skills.length === 0 ? (
        <p className="empty-state">
          No skill listings found.
        </p>
      ) : (
        <div className="grid">
          {skills.map((skill) => (
            <div className="card" key={skill._id}>
              <div style={{ marginBottom: 10 }}>
                <span className="tag">{skill.category}</span>{" "}
                <span className="tag">
                  {skill.type === "offered"
                    ? "Can Teach"
                    : "Wants to Learn"}
                </span>
              </div>

              <h3>{skill.title}</h3>

              <p
                style={{
                  color: "var(--color-ink-soft)",
                  fontSize: "0.9rem",
                }}
              >
                {skill.description}
              </p>

              <p style={{ fontSize: "0.85rem" }}>
                <strong>Teacher/User:</strong>{" "}
                {skill.user?.name || "Unknown"}

                {skill.user?.location
                  ? ` · ${skill.user.location}`
                  : ""}
              </p>

              <p style={{ fontSize: "0.85rem" }}>
                <strong>Level:</strong>{" "}
                {skill.level.charAt(0).toUpperCase() +
                  skill.level.slice(1)}
              </p>

              {/* Lesson Cost */}
              <p
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  marginTop: 8,
                }}
              >
                <strong>Lesson Cost:</strong>{" "}
                {getLessonCost(skill.level)} Credits
              </p>

              <p style={{ fontSize: "0.85rem" }}>
                <strong>Mode:</strong> {skill.mode}
              </p>

              {/* Only allow requesting another user's offered skill */}
              {user &&
                skill.user?._id !== user._id &&
                skill.type === "offered" && (
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      requestExchange(skill._id)
                    }
                  >
                    Request to Learn
                  </button>
                )}

              {/* Current user's listing */}
              {user &&
                skill.user?._id === user._id && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--color-ink-soft)",
                      marginTop: 10,
                    }}
                  >
                    This is your skill listing.
                  </p>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Skills;
