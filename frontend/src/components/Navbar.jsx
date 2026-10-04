import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Skill<span>Exchange</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Home</Link>

            <Link to="/skills">Browse Skills</Link>

            <Link to="/requests">My Requests</Link>

            <Link to="/profile">Profile</Link>

            <span className="credit-pill">
              {user.creditsBalance ?? 0} credits
            </span>

            <button onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
