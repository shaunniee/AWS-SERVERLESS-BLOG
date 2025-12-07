// src/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // send them to login, remember where they came from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
