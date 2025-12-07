import { useEffect, useState } from "react";
import { fetchLeads } from "../api";

export default function AdminLeads() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads()
      .then((data) => {
        setLeads(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load leads");
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[11px]">
            ★
          </span>
          <span className="text-sm font-semibold text-slate-50">
            Inbound leads
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Records captured from the public contact form. In AWS, these map to a
          DynamoDB <span className="font-mono text-[10px]">Leads</span> table
          and can fan out via SNS or EventBridge.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
          <div className="font-medium mb-0.5">Couldn&apos;t load leads</div>
          <p className="text-[11px] text-rose-100/90">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-6 gap-3 px-3 py-3 text-xs">
                  <div className="h-3 rounded bg-slate-800 animate-pulse col-span-1" />
                  <div className="h-3 rounded bg-slate-800 animate-pulse col-span-1" />
                  <div className="h-3 rounded bg-slate-800 animate-pulse col-span-1" />
                  <div className="h-3 rounded bg-slate-800 animate-pulse col-span-1" />
                  <div className="h-3 rounded bg-slate-800 animate-pulse col-span-1" />
                  <div className="h-3 rounded bg-slate-800 animate-pulse col-span-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && leads && leads.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-xs text-slate-300">
          No leads yet. Submit the public contact form to see records appear
          here and use this as an end-to-end demo of your inbound flow.
        </div>
      )}

      {/* Table */}
      {!loading && !error && leads && leads.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-400">Created</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Name</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Email</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Source</th>
                  <th className="px-3 py-2 font-medium text-slate-400 w-2/5">
                    Message
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/60">
                    <td className="px-3 py-2 align-top text-slate-300">
                      {l.createdAt}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-50">
                      {l.name || "-"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-300">
                      {l.email || "-"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-300">
                      {l.source || "-"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-200 max-w-xs">
                      <div className="line-clamp-3">{l.message}</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <StatusPill status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer meta */}
          <div className="border-t border-slate-800 px-3 py-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
            <span>
              Talking point: how you&apos;d add filtering, pagination, and
              archive states for real usage.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const label = status || "new";
  const normalized = label.toLowerCase();

  let colorClasses =
    "bg-slate-900 text-slate-100 border border-slate-700";

  if (normalized === "new") {
    colorClasses = "bg-sky-900/40 text-sky-200 border border-sky-500/40";
  } else if (normalized === "contacted") {
    colorClasses =
      "bg-amber-900/40 text-amber-200 border border-amber-500/40";
  } else if (normalized === "qualified") {
    colorClasses =
      "bg-emerald-900/40 text-emerald-200 border border-emerald-500/40";
  } else if (normalized === "closed") {
    colorClasses = "bg-slate-900 text-slate-200 border border-slate-600";
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        colorClasses,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
