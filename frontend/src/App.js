import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Skills from "./pages/Skills";
import MyRequests from "./pages/MyRequests";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />

          <div className="main-content">
            <Routes>

              {/* Home */}
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* Skills */}
              <Route
                path="/skills"
                element={
                  <PrivateRoute>
                    <Skills />
                  </PrivateRoute>
                }
              />

              {/* Requests */}
              <Route
                path="/requests"
                element={
                  <PrivateRoute>
                    <MyRequests />
                  </PrivateRoute>
                }
              />

              {/* Chat */}
              <Route
                path="/chat/:otherUserId"
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                }
              />

              {/* Profile */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
