"use client";

import { useState } from "react";
import type { ResonanceResult, ResonanceScoreResult, ResonanceRecommendation } from "@/lib/types";

interface Props {
  result: ResonanceResult;
  clientName: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600 bg-green-50 border-green-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-yellow-600 bg-yellow-50 border-yellow-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-red-600 bg-red-50 border-red-200",
};

const IMPACT_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-slate-100 text-slate-600",
};

const TYPE_LABELS: Record<string, string> = {
  ad: "Ad",
  post: "Post",
  audience: "Audience",
  creative: "Creative",
  messaging: "Messaging",
};

const ADS_DIMENSION_LABELS: Record<string, string> = {
  creativeResonance: "Creative Resonance",
  messagingAlignment: "Messaging Alignment",
  audienceTargeting: "Audience Targeting",
  conversionFit: "Conversion Fit",
};

const ORGANIC_DIMENSION_LABELS: Record<string, string> = {
  audienceReception: "Audience Reception",
  contentPerformance: "Content Performance",
  messagingAlignment: "Messaging Alignment",
  platformConsistency: "Platform Consistency",
};

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "text-green-600" : score >= 55 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-2xl font-bold ${color}`}>{score}</div>
      <div className="text-xs text-slate-500 text-center">{label}</div>
    </div>
  );
}

function RecommendationCard({ rec, index }: { rec: ResonanceRecommendation; index: number }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
          <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
            {TYPE_LABELS[rec.type] ?? rec.type}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${IMPACT_COLORS[rec.impact]}`}>
            {rec.impact}
          </span>
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-800">{rec.target}</div>
      {rec.currentState && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <span className="font-medium text-slate-600">Currently: </span>{rec.currentState}
        </div>
      )}
      <div className="text-xs text-blue-800 bg-blue-50 rounded-lg px-3 py-2">
        <span className="font-medium">Suggestion: </span>{rec.suggestion}
      </div>
      <div className="text-xs text-slate-500">{rec.reasoning}</div>
    </div>
  );
}

function ScorePanel({
  data,
  dimensionLabels,
  icon,
}: {
  data: ResonanceScoreResult;
  dimensionLabels: Record<string, string>;
  icon: string;
}) {
  const gradeClass = GRADE_COLORS[data.grade] ?? GRADE_COLORS.C;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{icon}</span>
              <p className="text-sm text-slate-600 max-w-xl">{data.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900">{data.score}</div>
              <div className="text-xs text-slate-500 mt-0.5">/ 100</div>
            </div>
            <div className={`text-3xl font-bold px-4 py-2 rounded-xl border-2 ${gradeClass}`}>
              {data.grade}
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Object.entries(data.dimensions).map(([key, dim]) => (
            <ScoreRing key={key} score={dim.score} label={dimensionLabels[key] ?? key} />
          ))}
        </div>
        <div className="space-y-3">
          {Object.entries(data.dimensions).map(([key, dim]) => (
            <div key={key} className="flex gap-3 text-sm">
              <span className="font-medium text-slate-700 w-48 shrink-0">
                {dimensionLabels[key] ?? key}
              </span>
              <span className="text-slate-600">{dim.finding}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Persona Fit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-3">
          Persona Fit —{" "}
          <span className="text-blue-600">{data.personaFit.primaryPersonaName}</span>
          <span className="ml-2 text-sm font-normal text-slate-500">
            Match: {data.personaFit.matchScore}/100
          </span>
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-green-700 mb-2">✓ Strengths</div>
            <ul className="space-y-1">
              {data.personaFit.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-green-500 shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-red-600 mb-2">✗ Gaps</div>
            <ul className="space-y-1">
              {data.personaFit.gaps.map((g, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-red-400 shrink-0">•</span>{g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Performers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Top Performers</h3>
          <div className="space-y-3">
            {data.topPerformers.map((p, i) => (
              <div key={i} className="text-sm border-l-2 border-green-400 pl-3">
                <div className="text-xs text-slate-400 mb-0.5 uppercase">{p.type.replace("_", " ")} · {p.metric}</div>
                <div className="text-slate-700 font-medium">"{p.identifier}"</div>
                <div className="text-slate-500 text-xs mt-0.5">{p.whyItLands}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Underperformers</h3>
          <div className="space-y-3">
            {data.bottomPerformers.map((p, i) => (
              <div key={i} className="text-sm border-l-2 border-red-300 pl-3">
                <div className="text-xs text-slate-400 mb-0.5 uppercase">{p.type.replace("_", " ")} · {p.metric}</div>
                <div className="text-slate-700 font-medium">"{p.identifier}"</div>
                <div className="text-slate-500 text-xs mt-0.5">{p.whyItMisses}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          Recommendations
          <span className="ml-2 text-sm font-normal text-slate-400">
            {data.recommendations.length} actions
          </span>
        </h3>
        <div className="space-y-3">
          {data.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResonancePanel({ result, clientName }: Props) {
  const [activeTab, setActiveTab] = useState<"ads" | "organic">("ads");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎯</span>
          <h2 className="text-lg font-bold text-slate-900">Resonance Score</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{clientName}</span>
        </div>

        {/* Score summary row */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab("ads")}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              activeTab === "ads"
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-700">📣 Ads Resonance</span>
              <span className={`text-lg font-bold px-2 py-0.5 rounded-lg border ${GRADE_COLORS[result.ads.grade] ?? GRADE_COLORS.C}`}>
                {result.ads.grade}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{result.ads.score}<span className="text-sm font-normal text-slate-400 ml-1">/ 100</span></div>
            <div className="text-xs text-slate-500 mt-1">Paid campaigns · creative · targeting</div>
          </button>

          <button
            onClick={() => setActiveTab("organic")}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              activeTab === "organic"
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-700">🌱 Organic Resonance</span>
              <span className={`text-lg font-bold px-2 py-0.5 rounded-lg border ${GRADE_COLORS[result.organic.grade] ?? GRADE_COLORS.C}`}>
                {result.organic.grade}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{result.organic.score}<span className="text-sm font-normal text-slate-400 ml-1">/ 100</span></div>
            <div className="text-xs text-slate-500 mt-1">Facebook & Instagram posts</div>
          </button>
        </div>
      </div>

      {/* Active panel */}
      {activeTab === "ads" ? (
        <ScorePanel data={result.ads} dimensionLabels={ADS_DIMENSION_LABELS} icon="📣" />
      ) : (
        <>
          <ScorePanel data={result.organic} dimensionLabels={ORGANIC_DIMENSION_LABELS} icon="🌱" />
          <p className="text-xs text-slate-400 text-center px-4">
            Instagram audience demographics (age, gender, location) reflect the lifetime follower base,
            not the selected date range — Meta&apos;s API does not support custom ranges for that
            metric. All other metrics respect the selected range.
          </p>
        </>
      )}
    </div>
  );
}
