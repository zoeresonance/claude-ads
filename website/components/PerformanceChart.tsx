"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyMetric } from "@/lib/types";

export interface ChartMetric {
  key: string;
  label: string;
  data: DailyMetric[];
  format: "currency" | "percent" | "number";
  color: string;
}

interface Props {
  title: string;
  metrics: ChartMetric[];
}

function formatValue(value: number, format: ChartMetric["format"]): string {
  if (format === "currency") return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (format === "percent") return `${value.toFixed(2)}%`;
  return value.toLocaleString();
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PerformanceChart({ title, metrics }: Props) {
  const [activeKey, setActiveKey] = useState(metrics[0]?.key ?? "");
  const active = metrics.find((m) => m.key === activeKey) ?? metrics[0];

  if (!active || active.data.length === 0) return null;

  const chartData = active.data.map((d) => ({ date: shortDate(d.date), value: d.value }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        <div className="flex gap-1 flex-wrap">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveKey(m.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                activeKey === m.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${activeKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={active.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={active.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatValue(v, active.format)}
            width={52}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            formatter={(v) => [formatValue(Number(v ?? 0), active.format), active.label]}
            labelStyle={{ color: "#475569", fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={active.color}
            strokeWidth={2}
            fill={`url(#grad-${activeKey})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
