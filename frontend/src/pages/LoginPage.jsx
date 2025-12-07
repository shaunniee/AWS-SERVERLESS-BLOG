// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, loading, authError, isAuthenticated } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // already logged in? just go to admin
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password); // AuthContext will navigate("/admin")
    } catch {
      // error already stored in authError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none" />

      <div className="w-full max-w-md px-4">
        {/* Back to site */}
        <div className="mb-4 flex items-center justify-between text-[11px] text-slate-400">
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-sky-400"
          >
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
              ← Back to site
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl px-5 py-6 sm:px-6 sm:py-7 backdrop-blur-md">
          {/* Heading */}
          <div className="mb-5 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] text-slate-200 border border-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Cognito-protected admin area
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-50">
              Admin login
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in with your Shaun Blog admin account to manage posts and
              review inbound leads.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-200">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-200">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-[11px] text-rose-100">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Hint */}
          <p className="mt-4 text-[11px] text-slate-400">
            In the AWS deployment, this flow is handled by Amazon Cognito user
            pools. Only admin users can access the{" "}
            <span className="font-mono text-[10px]">/admin</span> area, and each
            request to the API includes their JWT for authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
