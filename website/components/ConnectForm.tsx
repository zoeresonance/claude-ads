"use client";

import { useState } from "react";

interface Props {
  onAnalyze: (token: string, accountId: string) => void;
  loading: boolean;
}

export default function ConnectForm({ onAnalyze, loading }: Props) {
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [showToken, setShowToken] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim() || !accountId.trim()) {
      alert("Please enter both your access token and ad account ID.");
      return;
    }
    onAnalyze(token.trim(), accountId.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "🔑", title: "Paste credentials", desc: "Your token + ad account ID" },
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

      {/* Ad Account ID */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          Ad Account ID <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Find this in{" "}
          <span className="font-mono bg-slate-100 px-1 rounded">
            Ads Manager → top-left account menu
          </span>
          . Format: <span className="font-mono">act_123456789</span> or just the numbers.
        </p>
        <input
          type="text"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="act_944799492536152 or 944799492536152"
          required
          className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-mono"
        />
      </div>

      {/* Access Token */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          Access Token <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Get this from{" "}
          <a
            href="https://developers.facebook.com/tools/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700"
          >
            Meta Graph API Explorer
          </a>
          . Needs permissions: <span className="font-mono bg-slate-100 px-1 rounded">ads_read</span>,{" "}
          <span className="font-mono bg-slate-100 px-1 rounded">ads_management</span>,{" "}
          <span className="font-mono bg-slate-100 px-1 rounded">read_insights</span>.
        </p>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="EAAxxxxxxxxxxxxx..."
            required
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded"
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Security note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
        <span className="flex-shrink-0">🔒</span>
        <span>
          Your token is sent to our server only to fetch your Meta data and is never stored.
          For extra safety, use a token with <strong>read-only</strong> permissions (
          <code className="bg-amber-100 px-1 rounded">ads_read</code> only).
        </span>
      </div>

      <button
        type="submit"
        disabled={loading || !token || !accountId}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching your account data…
          </>
        ) : (
          "Connect & Analyze My Meta Account →"
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Pulls campaigns, ad sets, creatives, pixels, audiences, and 30-day performance data
      </p>
    </form>
  );
}
