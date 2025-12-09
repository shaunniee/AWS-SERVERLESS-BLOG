import React from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";

import Home from "./pages/Home.jsx";
import BlogList from "./pages/BlogList.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import Contact from "./pages/Contact.jsx";
import LoginPage from "./pages/LoginPage.jsx";

import AdminLayout from "./pages/AdminLayout.jsx";
import AdminPosts from "./pages/AdminPosts.jsx";
import AdminLeads from "./pages/AdminLeads.jsx";
import AdminPostEditor from "./pages/AdminPostEditor.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

function AppHeader() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/login");

  // Don’t show public header on admin or auth area
  if (isAdminRoute || isAuthRoute) return null;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-2xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-300 text-xs font-semibold">
            SB
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              Shaun · Cloud Blog & CRM
            </span>
            <span className="text-[11px] text-slate-400">
              Serverless AWS portfolio project
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                "px-3 py-1.5 rounded-full transition-colors",
                "text-xs sm:text-sm",
                isActive
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-50",
              ].join(" ")
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/blog"
            className={({ isActive }) =>
              [
                "px-3 py-1.5 rounded-full transition-colors",
                "text-xs sm:text-sm",
                isActive
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-50",
              ].join(" ")
            }
          >
            Blog
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              [
                "px-3 py-1.5 rounded-full transition-colors",
                "text-xs sm:text-sm",
                isActive
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-50",
              ].join(" ")
            }
          >
            Contact
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              [
                "ml-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                isActive
                  ? "border-sky-400 text-sky-300 bg-slate-900"
                  : "border-slate-600 text-slate-300 hover:bg-slate-900 hover:border-sky-400/70 hover:text-sky-200",
              ].join(" ")
            }
          >
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function AppFooter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/login");
  if (isAdminRoute || isAuthRoute) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-[11px] sm:text-xs text-slate-400 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between">
        <span>© {year} Shaun · AWS Blog & CRM case study</span>
        <span className="flex flex-wrap items-center gap-2">
          <span>React · Tailwind</span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span>API Gateway · Lambda · DynamoDB · Cognito</span>
        </span>
      </div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  const pathname = location.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/login");

  // Full-screen admin area (no public header/footer)
  if (isAdminRoute) {
    return (
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminPosts />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="posts/new" element={<AdminPostEditor />} />
          <Route path="posts/:slug/edit" element={<AdminPostEditor />} />
        </Route>
      </Routes>
    );
  }

  // Full-screen auth area (no public header/footer)
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  // Public site shell
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            {/* keep /login here as a fallback in case someone links it directly with shell in place */}
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
