"use client";

import { useState, useEffect } from "react";

interface AdAccount {
  id: string;
  name: string;
  currency: string;
}

interface Props {
  onAnalyze: (token: string, accountId: string) => void;
  loading: boolean;
}

export default function ConnectForm({ onAnalyze, loading }: Props) {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fetchingAccounts, setFetchingAccounts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setAccounts(json.accounts);
        if (json.accounts.length > 0) setSelectedId(json.accounts[0].id);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setFetchingAccounts(false));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    onAnalyze("", selectedId);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "📋", title: "Pick an account", desc: "Choose from your agency's linked accounts" },
          { icon: "📡", title: "Live data fetch", desc: "We pull from Meta's Marketing API" },
          { icon: "🤖", title: "AI audit", desc: "50-check analysis in ~20 seconds" },
        ].map((s) => (
          <div key={s.title} className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-semibold text-slate-800 text-sm">{s.title}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Account selector */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          Ad Account <span className="text-red-500">*</span>
        </label>

        {fetchingAccounts && (
          <p className="text-sm text-slate-500 animate-pulse">Loading accounts…</p>
        )}

        {fetchError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {fetchError}
          </p>
        )}

        {!fetchingAccounts && !fetchError && accounts.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 bg-white"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.id} ({a.currency})
              </option>
            ))}
          </select>
        )}
      </div>

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
            Fetching account data…
          </>
        ) : (
          "Analyze This Account →"
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Pulls campaigns, ad sets, creatives, pixels, audiences, and 30-day performance data
      </p>
    </form>
  );
}
