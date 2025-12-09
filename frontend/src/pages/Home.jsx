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
            Personal AWS blog & CRM
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            A{" "}
            <span className="text-emerald-600">serverless cloud journal</span>{" "}
            for projects, notes and experiments.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            This site is where I write about what I&apos;m building on AWS:
            architectures, experiments, small tools and lessons learned.
            Behind the scenes it runs on a serverless stack with a simple CRM
            for managing posts and contact messages.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm hover:bg-slate-800"
            >
              Read the blog
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Get in touch
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Blog
              </div>
              <p>
                Articles on AWS, cloud patterns, small experiments, and
                how different pieces fit together.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Projects
              </div>
              <p>
                Real implementations: serverless APIs, data models,
                authentication flows and integrations.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Contact
              </div>
              <p>
                A simple CRM behind the contact form to track messages,
                ideas and follow-ups.
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
                  Under the hood
                </div>
                <div className="text-[11px] text-slate-500">
                  How this site is wired together
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
                  React single-page app, with routes for the blog, individual
                  posts, contact form and admin area.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    API layer:
                  </span>{" "}
                  REST endpoints in API Gateway invoking Lambda functions
                  for blog posts and contact leads.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    Data:
                  </span>{" "}
                  DynamoDB as the primary store, modelling posts and
                  leads with a single-table PK/SK design.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
                <p>
                  <span className="font-semibold text-slate-900">
                    Auth:
                  </span>{" "}
                  Cognito user pool for admin access, passing JWTs to
                  API Gateway for protected routes.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-900">
                Why it&apos;s interesting:
              </span>{" "}
              it&apos;s a small but complete application: UI, APIs, data,
              auth and a simple admin workflow all working together.
            </div>
          </div>
        </div>
      </section>

      {/* What you'll find here */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">
              What you&apos;ll find on this site
            </h2>
            <p className="text-xs text-slate-600 max-w-xl">
              Posts here focus on how things are actually built: the AWS
              services involved, trade-offs, and the steps to get something
              running end to end.
            </p>
          </div>
          <div className="grid gap-2 text-xs text-slate-600 sm:max-w-md">
            <div className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
              <p>
                Walkthroughs of{" "}
                <span className="font-medium">serverless patterns</span>, VPC
                setups, data modelling and real deployments.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
              <p>
                Notes on{" "}
                <span className="font-medium">
                  authentication, authorization and IAM
                </span>{" "}
                using Cognito, API Gateway and Lambda.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
              <p>
                Small experiments and ideas that tie together different
                AWS services and tooling.
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
            CI/CD (CodeBuild / GitHub)
          </span>
        </div>
      </section>
    </div>
  );
}
