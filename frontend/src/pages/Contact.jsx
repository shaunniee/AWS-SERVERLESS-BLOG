import { useState } from "react";
import { sendContact } from "../api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      await sendContact({ ...form, source: "/contact" });
      setForm({ name: "", email: "", message: "" });
      setStatus("sent");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatus("");
    }
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 text-[11px] font-medium text-slate-200 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Contact · feeds the AWS CRM
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Contact
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Drop a message here. In the AWS deployment, this form becomes a lead
          capture entrypoint, writing to DynamoDB and triggering notifications
          so you can demo a real-world serverless workflow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)] items-start">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 max-w-xl"
            noValidate
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Name
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={form.name}
                onChange={update("name")}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Message
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={form.message}
                onChange={update("message")}
                rows={4}
                placeholder="Tell me what you’d like to build, migrate or fix on AWS."
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send message"}
            </button>

            {status === "sent" && (
              <p className="mt-2 text-xs text-emerald-700 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                Thanks — your message has been captured. In the full AWS setup,
                this shows up as a lead in the admin CRM and can trigger
                notifications.
              </p>
            )}

            {error && (
              <p className="mt-2 text-xs text-rose-700 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                Error: {error}
              </p>
            )}
          </form>
        </div>

        {/* “What happens in AWS” card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-3 text-xs sm:text-sm text-slate-600">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
            How this form fits into the architecture
          </div>
          <p>
            In local/dev mode this calls your mock API. In AWS, the exact same
            UI becomes a lead capture entrypoint wired into your serverless
            stack:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-medium text-slate-800">Frontend</span> –
              React sends the payload to your API Gateway endpoint.
            </li>
            <li>
              <span className="font-medium text-slate-800">Lambda</span> –
              validates input, enriches metadata (IP, user agent, environment),
              and writes a record to the{" "}
              <span className="font-mono text-[11px]">
                Leads
              </span>{" "}
              DynamoDB table.
            </li>
            <li>
              <span className="font-medium text-slate-800">Notifications</span>{" "}
              – optional SNS topic or email integration to alert you when a new
              lead lands.
            </li>
            <li>
              <span className="font-medium text-slate-800">
                Admin CRM
              </span>{" "}
              – the record is surfaced in the authenticated admin area so you
              can show end-to-end lead lifecycle.
            </li>
          </ul>
          <p className="text-[11px] text-slate-500 pt-1">
            Good talking point: how you’d add retries, dead-letter queues, and
            basic rate limiting if this received real production traffic.
          </p>
        </div>
      </div>
    </section>
  );
}
