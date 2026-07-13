"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CATEGORICAL_DARK,
  CATEGORICAL_LIGHT,
  CHART_CHROME,
  type ChartChrome,
  EXPENSE_DARK,
  EXPENSE_LIGHT,
  INCOME_DARK,
  INCOME_LIGHT,
  NEUTRAL_LINE_DARK,
  NEUTRAL_LINE_LIGHT,
} from "@/lib/chart-colors";
import { CategoryTotal, DayFlow, MonthPoint } from "@/lib/finance";
import { formatBRL, monthLabel } from "@/lib/utils";
import { useTheme } from "./theme";

function useChrome() {
  const { isDark } = useTheme();
  return {
    isDark,
    chrome: isDark ? CHART_CHROME.dark : CHART_CHROME.light,
    income: isDark ? INCOME_DARK : INCOME_LIGHT,
    expense: isDark ? EXPENSE_DARK : EXPENSE_LIGHT,
    line: isDark ? NEUTRAL_LINE_DARK : NEUTRAL_LINE_LIGHT,
    palette: isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT,
  };
}

function compactBRL(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(".", ",")}k`;
  return String(Math.round(v));
}

interface TooltipRow {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
}

function MoneyTooltip({
  active,
  payload,
  label,
  chrome,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string | number;
  chrome: ChartChrome;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: chrome.tooltipBg, border: `1px solid ${chrome.tooltipBorder}`, color: chrome.text }}
    >
      {label !== undefined && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((row, i) => (
        <p key={i} className="flex items-center gap-1.5 tabular-nums">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
          {row.name}: <strong>{formatBRL(Number(row.value ?? 0))}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Entradas x Saídas (barras mensais) ─────────────────────────────────────

export function IncomeExpenseChart({ data, height = 260 }: { data: MonthPoint[]; height?: number }) {
  const { chrome, income, expense } = useChrome();
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.ym, true) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} barGap={2} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chrome.grid} strokeWidth={1} />
        <XAxis dataKey="label" tick={{ fill: chrome.tick, fontSize: 11 }} axisLine={{ stroke: chrome.axis }} tickLine={false} />
        <YAxis tick={{ fill: chrome.tick, fontSize: 11 }} tickFormatter={compactBRL} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={(p) => <MoneyTooltip {...p} chrome={chrome} />} cursor={{ fill: chrome.grid, opacity: 0.35 }} />
        <Legend wrapperStyle={{ fontSize: 12, color: chrome.tick }} iconType="circle" iconSize={8} />
        <Bar dataKey="receitas" name="Receitas" fill={income} radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="despesas" name="Despesas" fill={expense} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Donut por categoria ─────────────────────────────────────────────────────

export function CategoryDonutChart({
  data,
  height = 220,
  centerLabel,
}: {
  data: CategoryTotal[];
  height?: number;
  centerLabel?: string;
}) {
  const { chrome, isDark } = useChrome();
  const top = data.slice(0, 7);
  const rest = data.slice(7);
  const rows = [
    ...top.map((d) => ({ name: d.category.name, value: d.total, color: d.category.color })),
    ...(rest.length > 0
      ? [{ name: "Outros", value: rest.reduce((s, d) => s + d.total, 0), color: "#64748B" }]
      : []),
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip content={(p) => <MoneyTooltip {...p} chrome={chrome} />} />
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            strokeWidth={2}
            stroke={isDark ? "#111827" : "#ffffff"}
          >
            {rows.map((r, i) => (
              <Cell key={i} fill={r.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{centerLabel ?? "Total"}</span>
        <span className="text-lg font-bold tabular-nums">{formatBRL(total, { compact: true })}</span>
      </div>
    </div>
  );
}

// ─── Fluxo de caixa diário ──────────────────────────────────────────────────

export function CashFlowChart({ data, height = 240 }: { data: DayFlow[]; height?: number }) {
  const { chrome, line } = useChrome();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="ff-flow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={line} stopOpacity={0.25} />
            <stop offset="100%" stopColor={line} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={chrome.grid} strokeWidth={1} />
        <XAxis dataKey="day" tick={{ fill: chrome.tick, fontSize: 11 }} axisLine={{ stroke: chrome.axis }} tickLine={false} interval={4} />
        <YAxis tick={{ fill: chrome.tick, fontSize: 11 }} tickFormatter={compactBRL} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          content={(p) => <MoneyTooltip {...p} label={p.label !== undefined ? `Dia ${p.label}` : undefined} chrome={chrome} />}
        />
        <Area
          type="monotone"
          dataKey="acumulado"
          name="Resultado acumulado"
          stroke={line}
          strokeWidth={2}
          fill="url(#ff-flow)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Linha de tendência genérica ─────────────────────────────────────────────

export function TrendLineChart({
  data,
  height = 240,
  name = "Valor",
}: {
  data: { label: string; value: number }[];
  height?: number;
  name?: string;
}) {
  const { chrome, line } = useChrome();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chrome.grid} strokeWidth={1} />
        <XAxis dataKey="label" tick={{ fill: chrome.tick, fontSize: 11 }} axisLine={{ stroke: chrome.axis }} tickLine={false} />
        <YAxis tick={{ fill: chrome.tick, fontSize: 11 }} tickFormatter={compactBRL} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={(p) => <MoneyTooltip {...p} chrome={chrome} />} />
        <Line type="monotone" dataKey="value" name={name} stroke={line} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Barras horizontais por entidade (categorias, cartões, bancos…) ─────────

export function HBarChart({
  data,
  height,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const { chrome } = useChrome();
  const h = height ?? Math.max(120, data.length * 38 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={chrome.grid} strokeWidth={1} />
        <XAxis type="number" tick={{ fill: chrome.tick, fontSize: 11 }} tickFormatter={compactBRL} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: chrome.tick, fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
        <Tooltip content={(p) => <MoneyTooltip {...p} chrome={chrome} />} cursor={{ fill: chrome.grid, opacity: 0.35 }} />
        <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((r, i) => (
            <Cell key={i} fill={r.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
