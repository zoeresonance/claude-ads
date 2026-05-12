"use client";

import { useState, useEffect } from "react";
import DateRangePicker, { DateRange, defaultDateRange } from "./DateRangePicker";

interface Client {
  name: string;
  adAccountId: string;
}

interface Props {
  onAnalyze: (token: string, accountId: string, dateRange: DateRange) => void;
  loading: boolean;
}

export default function ConnectForm({ onAnalyze, loading }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fetchingClients, setFetchingClients] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setClients(json.clients);
        if (json.clients.length > 0) setSelectedId(json.clients[0].adAccountId);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setFetchingClients(false));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    onAnalyze("", selectedId, dateRange);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "👤", title: "Pick a client", desc: "Choose from your configured clients" },
          { icon: "📅", title: "Choose a date range", desc: "Adjust the analysis window" },
          { icon: "🤖", title: "AI audit + resonance", desc: "Health and audience scoring in ~30 sec" },
        ].map((s) => (
          <div key={s.title} className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-semibold text-slate-800 text-sm">{s.title}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Client selector */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          Client <span className="text-red-500">*</span>
        </label>

        {fetchingClients && (
          <p className="text-sm text-slate-500 animate-pulse">Loading clients…</p>
        )}

        {fetchError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {fetchError}
          </p>
        )}

        {!fetchingClients && !fetchError && clients.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 bg-white"
          >
            {clients.map((c) => (
              <option key={c.adAccountId} value={c.adAccountId}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {!fetchingClients && !fetchError && clients.length === 0 && (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            No clients configured. Add a client folder under <code className="text-xs bg-slate-100 px-1 rounded">website/clients/</code>.
          </p>
        )}
      </div>

      {/* Date range */}
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <button
        type="submit"
        disabled={loading || !selectedId}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching data…
          </>
        ) : (
          "Analyze Client →"
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Pulls campaigns, ad sets, creatives, pixels, audiences, and performance data for the selected range
      </p>
    </form>
  );
}
