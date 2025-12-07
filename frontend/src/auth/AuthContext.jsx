// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState,useEffect, use } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  getStoredUsername,
  clearStoredSession,
  getStoredAccessToken
} from "./cognito";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const username = getStoredUsername();
    return username ? { username } : null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
 

   useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    try {
  console.log('checking stored token',token);
      const { exp } = jwtDecode(token); // exp in seconds
      const expiresAt = exp * 1000;
          console.log('token expiry', exp);

      if (expiresAt <= Date.now()) {
        // token already expired
        clearStoredSession();
        return;
      }

      setAccessToken(token);
      const storedUser = getStoredUsername();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (e) {
      console.error("Error decoding stored token", e);
      // bad token in storage – just clear it
      clearStoredSession();
    }
  }, []);

    // 2) Auto-logout when token expires
  useEffect(() => {
    if (!accessToken) return;

    let timerId;

    try {
      const { exp } = jwtDecode(accessToken);
      const expiresAt = exp * 1000;
      const timeoutMs = expiresAt - Date.now();

      if (timeoutMs <= 0) {
        // already expired
        doLogout(true);
        return;
      }

      timerId = window.setTimeout(() => {
        doLogout(true);
      }, timeoutMs);
    } catch (e) {
      // if decoding failed, be safe and log out
      doLogout(false);
    }

    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const doLogout = (expired = false) => {
    clearStoredSession();
    try {
      cognitoSignOut(); // ok if this just no-ops or calls Cognito logout
    } catch {
      // ignore
    }
    setUser(null);
    setAccessToken(null);

    if (expired) {
      setAuthError("Your session has expired. Please sign in again.");
    } else {
      setAuthError(null);
    }
  };


  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      await cognitoSignIn(username, password);
      setUser({ username });
      // ✅ redirect to admin after successful login
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Login failed", err);
      setAuthError(err?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    cognitoSignOut();        // make sure this is exported from cognito.js
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = {
    user,
    loading,
    authError,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
