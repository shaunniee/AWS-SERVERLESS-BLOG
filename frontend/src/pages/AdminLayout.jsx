// src/pages/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isLeads = location.pathname.includes("/admin/leads");
  const pageTitle = isLeads ? "Leads" : "Posts";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/95 flex flex-col">
        {/* Brand / top */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-300 text-xs font-semibold">
              SB
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Shaun Blog
              </span>
              <span className="text-[11px] text-slate-400">
                Admin dashboard
              </span>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] text-slate-300 border border-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Protected area
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-1">
            Content
          </div>

          <NavLink
            to="/admin/posts"
            className={({ isActive }) =>
              [
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm transition-colors",
                "hover:bg-slate-900 hover:text-slate-50",
                isActive
                  ? "bg-slate-900 text-slate-50 border border-sky-500/40"
                  : "text-slate-300 border border-transparent",
              ].join(" ")
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>Posts</span>
          </NavLink>

          <NavLink
            to="/admin/leads"
            className={({ isActive }) =>
              [
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm transition-colors",
                "hover:bg-slate-900 hover:text-slate-50",
                isActive
                  ? "bg-slate-900 text-slate-50 border border-emerald-500/40"
                  : "text-slate-300 border border-transparent",
              ].join(" ")
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Leads</span>
          </NavLink>
        </nav>

        {/* Footer / user */}
        <div className="border-t border-slate-800 px-4 py-4 text-[11px] space-y-2">
          <div className="flex flex-col">
            <span className="text-slate-400">Signed in as</span>
            <span className="font-medium text-slate-100 truncate">
              {user?.username}
            </span>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center rounded-full border border-slate-600 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-slate-900 hover:border-slate-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Admin
            </span>
            <span className="text-sm sm:text-base font-semibold text-slate-50">
              {pageTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Jump to public view */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-900 hover:border-sky-500/60 hover:text-sky-200 transition-colors"
            >
              ← View public site
            </Link>

            <div className="flex flex-col items-end text-[11px]">
              <span className="text-slate-400">Signed in</span>
              <span className="font-medium text-slate-100 truncate max-w-[140px]">
                {user?.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-100 border border-slate-600 hover:bg-slate-800 hover:border-slate-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 py-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg">
              <div className="p-4 sm:p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
