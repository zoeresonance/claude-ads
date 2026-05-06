"use client";

import { useState, useEffect } from "react";

interface AdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
}

interface SavedSession {
  token: string;
  expiresAt: number;
  expiresInDays: number;
}

interface Props {
  onAnalyze: (token: string, accountId: string) => void;
  loading: boolean;
}

const STORAGE_KEY = "meta_session";

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: SavedSession = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function daysRemaining(expiresAt: number): number {
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 86400000));
}

export default function ConnectForm({ onAnalyze, loading }: Props) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [manualId, setManualId] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  const accountId = useManual ? manualId : selectedId;

  // On mount: restore saved session and auto-load accounts
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setSavedSession(session);
      setToken(session.token);
      fetchAccounts(session.token, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAccounts(t: string, exchange: boolean) {
    setFetchingAccounts(true);
    setFetchError(null);
    setAccounts([]);
    setSelectedId("");

    try {
      // Exchange for long-lived token if requested
      if (exchange) {
        const exchRes = await fetch("/api/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: t }),
        });
        const exchJson = await exchRes.json();
        if (!exchRes.ok || exchJson.error) {
          // Exchange failed — continue with the original token, don't block the user
          console.warn("Token exchange failed:", exchJson.error);
        } else {
          t = exchJson.accessToken;
          setToken(t);
          const session: SavedSession = {
            token: t,
            expiresAt: exchJson.expiresAt,
            expiresInDays: exchJson.expiresInDays,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          setSavedSession(session);
        }
      }

      // Fetch ad accounts
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,currency,account_status&limit=50&access_token=${encodeURIComponent(t)}`
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      const active = (json.data as AdAccount[]).filter((a) => a.account_status === 1);
      if (!active.length) throw new Error("No active ad accounts found for this token.");
      setAccounts(active);
      setSelectedId(active[0].id);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch accounts.");
    } finally {
      setFetchingAccounts(false);
    }
  }

  function handleClearSession() {
    localStorage.removeItem(STORAGE_KEY);
    setSavedSession(null);
    setToken("");
    setAccounts([]);
    setSelectedId("");
    setFetchError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim() || !accountId.trim()) return;
    onAnalyze(token.trim(), accountId.trim());
  }

  const canFetch = token.trim().length > 10 && !fetchingAccounts;
  const canSubmit = !loading && token.trim() && accountId.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "🔑", title: "Paste your token", desc: "From Meta Graph API Explorer" },
          { icon: "📡", title: "Pick your account", desc: "We fetch your ad accounts automatically" },
          { icon: "🤖", title: "AI audit", desc: "50-check analysis in ~20 seconds" },
        ].map((s) => (
          <div key={s.title} className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-semibold text-slate-800 text-sm">{s.title}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Saved session banner */}
      {savedSession && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <span>✓</span>
            <span>
              Session saved —{" "}
              <strong>{daysRemaining(savedSession.expiresAt)} days</strong> remaining
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSession}
            className="text-xs text-green-600 hover:text-green-800 underline whitespace-nowrap"
          >
            Clear session
          </button>
        </div>
      )}

      {/* Step 1: Access Token */}
      {!savedSession && (
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Step 1 — Access Token <span className="text-red-500">*</span>
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
            . Needs:{" "}
            <span className="font-mono bg-slate-100 px-1 rounded">ads_read</span>,{" "}
            <span className="font-mono bg-slate-100 px-1 rounded">ads_management</span>,{" "}
            <span className="font-mono bg-slate-100 px-1 rounded">read_insights</span>.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setAccounts([]);
                  setSelectedId("");
                  setFetchError(null);
                }}
                placeholder="EAAxxxxxxxxxxxxx..."
                required
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => fetchAccounts(token.trim(), true)}
              disabled={!canFetch}
              className="px-4 py-3 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {fetchingAccounts ? "Fetching…" : "Fetch accounts"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Account selector */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          {savedSession ? "Ad Account" : "Step 2 — Ad Account"}{" "}
          <span className="text-red-500">*</span>
        </label>

        {fetchingAccounts && (
          <p className="text-xs text-slate-500 animate-pulse">Loading your ad accounts…</p>
        )}

        {accounts.length > 0 && !useManual ? (
          <>
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
            <button
              type="button"
              onClick={() => setUseManual(true)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Enter account ID manually instead
            </button>
          </>
        ) : (
          !fetchingAccounts && (
            <>
              {!useManual && (
                <p className="text-xs text-slate-500">
                  Paste your token above and click <strong>Fetch accounts</strong>, or enter your
                  ID manually below.
                </p>
              )}
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="act_944799492536152 or 944799492536152"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 font-mono"
              />
              {useManual && (
                <button
                  type="button"
                  onClick={() => { setUseManual(false); setManualId(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  ← Back to dropdown
                </button>
              )}
            </>
          )
        )}

        {fetchError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {fetchError} — enter your account ID manually above.
          </p>
        )}
      </div>

      {/* Security note */}
      {!savedSession && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
          <span className="flex-shrink-0">🔒</span>
          <span>
            Your token is exchanged for a 60-day session token and saved only in your browser.
            It is never stored on our servers. Click <strong>Clear session</strong> at any time
            to remove it.
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
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
