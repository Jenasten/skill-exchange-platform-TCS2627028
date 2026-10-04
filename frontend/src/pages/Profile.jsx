import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", bio: "", location: "", skillsOffered: "", skillsWanted: "" });
  const [reviews, setReviews] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        skillsOffered: (user.skillsOffered || []).join(", "),
        skillsWanted: (user.skillsWanted || []).join(", "),
      });
      api.get(`/reviews/user/${user._id}`).then((res) => setReviews(res.data));
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await api.put("/users/me", {
      name: form.name,
      bio: form.bio,
      location: form.location,
      skillsOffered: form.skillsOffered.split(",").map((s) => s.trim()).filter(Boolean),
      skillsWanted: form.skillsWanted.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setUser({ ...user, ...res.data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
      <div className="card">
        <h2>My profile</h2>
        {saved && <p style={{ color: "var(--color-primary)" }}>Profile updated.</p>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Skills I can offer (comma separated)</label>
            <input value={form.skillsOffered} onChange={(e) => setForm({ ...form, skillsOffered: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Skills I want to learn (comma separated)</label>
            <input value={form.skillsWanted} onChange={(e) => setForm({ ...form, skillsWanted: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">Save changes</button>
        </form>
      </div>

      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Credits balance</h3>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-accent)" }}>{user.creditsBalance}</p>
          <p style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)" }}>
            Earned by teaching, spent when someone teaches you.
          </p>
        </div>
        <div className="card">
          <h3>Reviews received ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="empty-state">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} style={{ borderBottom: "1px solid var(--color-border)", padding: "8px 0" }}>
                <strong>{r.reviewer?.name}</strong> — {"★".repeat(r.rating)}
                <p style={{ fontSize: "0.9rem", margin: "4px 0 0" }}>{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
