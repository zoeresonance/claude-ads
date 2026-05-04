"use client";

import { useState, useRef } from "react";
import ConnectForm from "@/components/ConnectForm";
import InputForm from "@/components/InputForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import type { AdMetrics, AnalysisResult } from "@/lib/types";

type Mode = "connect" | "manual";

interface AccountMeta {
  name: string;
  id: string;
  currency: string;
  campaigns: number;
  adsets: number;
  ads: number;
  spend?: string;
  fetchedAt: string;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("connect");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [account, setAccount] = useState<AccountMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleConnect(token: string, accountId: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAccount(null);
    setLoadingMsg("Fetching your Meta account data…");

    try {
      const res = await fetch("/api/meta-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accountId }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Analysis failed");
      }

      setResult(data.result);
      setAccount(data.account ?? null);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  async function handleManual(metrics: AdMetrics) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAccount(null);
    setLoadingMsg("Running your 50-check audit…");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Analysis failed");
      }

      setResult(data.result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setAccount(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              Meta Performance Analyzer
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Powered by</span>
            <span className="font-semibold text-slate-700">Claude Sonnet</span>
            <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
              50 checks
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero */}
        {!result && !loading && (
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              Diagnose Your Meta Ads
              <span className="text-blue-600"> in 60 Seconds</span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Connect your Meta account and get a live 50-check AI audit — Pixel/CAPI,
              creative fatigue, account structure, and targeting. Benchmarked against
              2026 industry standards.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["50-check audit", "Health score 0–100", "Quick wins", "Real account data", "Andromeda analysis", "Creative fatigue"].map((f) => (
                <span key={f} className="text-xs bg-blue-50 text-blue-700 font-medium px-3 py-1 rounded-full border border-blue-100">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg mb-1">{loadingMsg}</h3>
            <p className="text-slate-500 text-sm">
              {mode === "connect"
                ? "Fetching campaigns, ad sets, creatives, pixels, audiences, and 30-day insights from the Meta Marketing API — then running the full audit."
                : "Claude is evaluating all 50 checks across Pixel/CAPI, creative, structure, and audience. This takes about 20 seconds."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-800 font-semibold mb-1">Something went wrong</p>
            <p className="text-red-600 text-sm">{error}</p>
            {error.toLowerCase().includes("oauthexception") ||
            error.toLowerCase().includes("token") ? (
              <p className="text-red-500 text-xs mt-2">
                Your access token may have expired. Generate a new one at{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Graph API Explorer
                </a>
                .
              </p>
            ) : (
              <p className="text-red-500 text-xs mt-2">
                Make sure GOOGLE_AI_API_KEY is set in your environment variables.
              </p>
            )}
          </div>
        )}

        {/* Input forms */}
        {!loading && !result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Mode tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setMode("connect")}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  mode === "connect"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700 bg-slate-50"
                }`}
              >
                📡 Connect Meta Account
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  mode === "manual"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-700 bg-slate-50"
                }`}
              >
                ✏️ Enter Metrics Manually
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {mode === "connect" ? (
                <ConnectForm onAnalyze={handleConnect} loading={loading} />
              ) : (
                <InputForm onAnalyze={handleManual} loading={loading} />
              )}
            </div>
          </div>
        )}

        {/* Account summary bar (shown with results) */}
        {result && account && !loading && (
          <div className="bg-blue-600 text-white rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-blue-200 text-xs font-medium">Account</p>
              <p className="font-bold">{account.name}</p>
            </div>
            <div className="h-8 w-px bg-blue-500 hidden sm:block" />
            <div>
              <p className="text-blue-200 text-xs font-medium">Campaigns</p>
              <p className="font-bold">{account.campaigns}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-medium">Ad Sets</p>
              <p className="font-bold">{account.adsets}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-medium">Ads</p>
              <p className="font-bold">{account.ads}</p>
            </div>
            {account.spend && (
              <div>
                <p className="text-blue-200 text-xs font-medium">30-Day Spend</p>
                <p className="font-bold">
                  ${parseFloat(account.spend).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <div className="ml-auto text-right">
              <p className="text-blue-200 text-xs">
                Data fetched {new Date(account.fetchedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div ref={resultsRef}>
            <ResultsDashboard result={result} onReset={handleReset} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400">
          <p>
            Built with{" "}
            <a
              href="https://github.com/zoeresonance/claude-ads"
              className="text-slate-500 hover:text-blue-600 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              claude-ads
            </a>{" "}
            · Audit framework v1.5 · Meta Marketing API v21.0 · Benchmarks updated 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
