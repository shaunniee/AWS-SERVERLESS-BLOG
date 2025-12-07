import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
        {/* Left: main pitch */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            End-to-end AWS blog & CRM platform
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            A portfolio-ready{" "}
            <span className="text-emerald-600">serverless blog</span>{" "}
            with a real CRM backend.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            This isn’t just a static blog. It’s a full application:
            React front end, API Gateway + Lambda backend, DynamoDB
            storage, Cognito authentication, and an internal CRM where
            you can manage posts and inbound leads.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm hover:bg-slate-800"
            >
              View public blog
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Admin login
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Frontend
              </div>
              <p>
                React SPA with routing, protected admin area, and a
                layout designed for real project write-ups.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Backend
              </div>
              <p>
                API Gateway + Lambda functions for posts and leads, using
                DynamoDB as the primary data store.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Security
              </div>
              <p>
                Cognito user pool for admin auth, JWT-protected admin
                APIs, and clean separation of public vs private routes.
              </p>
            </div>
          </div>
        </div>

        {/* Right: architecture highlight card */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-200/40 via-sky-200/20 to-transparent blur-2xl" />
          <div className="relative rounded-3xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-900/5 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Architecture at a glance
                </div>
                <div className="text-[11px] text-slate-500">
                  High-level flow of this project
                </div>
              </div>
              <span className="text-[10px] rounded-full bg-slate-900 text-slate-50 px-2 py-1">
                Serverless
              </span>
            </div>

            <div className="space-y-3 text-[11px] text-slate-600">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    Frontend:
                  </span>{" "}
                  React SPA served from S3 + CloudFront (deploy-ready),
                  with routes for blog, contact, and admin.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    API layer:
                  </span>{" "}
                  REST endpoints in API Gateway invoking Lambda
                  functions for posts and leads.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    Data:
                  </span>{" "}
                  Single DynamoDB table modelling blog posts, contact
                  leads and admin views using PK/SK patterns.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    Auth:
                  </span>{" "}
                  Cognito user pool, hosted UI / SDK in React, JWT
                  passed to API Gateway for admin-only routes.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-900">
                What this demonstrates:
              </span>{" "}
              front-to-back design, IAM-safe serverless patterns, and
              a realistic “mini-SaaS” style admin experience.
            </div>
          </div>
        </div>
      </section>

      {/* Why this project matters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Why this project is useful to showcase
            </h2>
            <p className="text-xs text-slate-600 max-w-xl">
              This app is built to be something you can talk about in
              an interview: not just “I used Lambda”, but how all the
              moving pieces fit together.
            </p>
          </div>
          <div className="grid gap-2 text-xs text-slate-600 sm:max-w-md">
            <div className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
              <p>
                Shows you can design and implement a{" "}
                <span className="font-medium">
                  full serverless architecture
                </span>{" "}
                rather than isolated services.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
              <p>
                Demonstrates handling{" "}
                <span className="font-medium">
                  authentication, authorization and JWTs
                </span>{" "}
                correctly with Cognito + API Gateway.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
              <p>
                Includes a real{" "}
                <span className="font-medium">admin dashboard</span>{" "}
                and simple CRM flow — something hiring managers
                immediately understand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack strip */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Tech stack
          </div>
          <div className="text-[11px] text-slate-400">
            Frontend · Backend · Auth · Data
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-900 text-slate-50 px-3 py-1">
            React + Vite
          </span>
          <span className="rounded-full bg-slate-900 text-slate-50 px-3 py-1">
            Tailwind CSS
          </span>
          <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-1">
            AWS API Gateway
          </span>
          <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-1">
            AWS Lambda
          </span>
          <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-1">
            Amazon DynamoDB
          </span>
          <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-1">
            Amazon Cognito
          </span>
          <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-1">
            CI/CD-ready (CodeBuild / GitHub Actions)
          </span>
        </div>
      </section>
    </div>
  );
}
