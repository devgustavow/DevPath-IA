"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CashFlowChart, CategoryDonutChart, IncomeExpenseChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, EmptyState, IconCircle, Modal, Money, Progress, Tabs } from "@/components/ui";
import {
  accountBalance,
  categoryBreakdown,
  dailyCashFlow,
  forecastEndOfMonth,
  generateInsights,
  goalStats,
  healthScore,
  investmentTotals,
  monthExpense,
  monthIncome,
  monthlySeries,
  pendingBills,
  totalBalance,
} from "@/lib/finance";
import { useStore } from "@/lib/store";
import { DEFAULT_WIDGETS } from "@/lib/types";
import { addMonths, cn, currentMonth, formatBRL, formatDate, monthLabel, relativeDays } from "@/lib/utils";

const WIDGET_LABELS: Record<string, string> = {
  saldo: "Saldo atual",
  receitas: "Receitas do mês",
  despesas: "Despesas do mês",
  economia: "Economia do mês",
  investido: "Valor investido",
  score: "Saúde financeira",
  fluxo: "Gráficos de fluxo",
  categorias: "Gastos por categoria",
  "contas-vencer": "Contas a vencer",
  movimentacoes: "Últimas movimentações",
  meta: "Metas financeiras",
  insights: "Insights da IA",
};

function StatTile({
  label,
  value,
  icon,
  delta,
  hint,
  tone = "neutral",
  index,
}: {
  label: string;
  value: string;
  icon: string;
  delta?: { value: number; label: string };
  hint?: string;
  tone?: "neutral" | "green" | "red" | "blue" | "violet";
  index: number;
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    red: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="ff-card ff-card-hover p-4 md:col-span-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{value}</p>
      {delta && (
        <p className={cn("mt-1 flex items-center gap-1 text-[11px]", delta.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
          <Icon name={delta.value >= 0 ? "TrendingUp" : "TrendingDown"} className="h-3 w-3" />
          {delta.label}
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </motion.div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#3B82F6" : score >= 40 ? "#D97706" : "#E11D48";
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-slate-100 dark:stroke-slate-800" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] text-slate-400">/100</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { state, dispatch } = useStore();
  const ym = currentMonth();
  const prevYm = addMonths(ym, -1);
  const [flowTab, setFlowTab] = useState("mensal");
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const balance = useMemo(() => totalBalance(state), [state]);
  const income = useMemo(() => monthIncome(state, ym), [state, ym]);
  const expense = useMemo(() => monthExpense(state, ym), [state, ym]);
  const prevIncome = useMemo(() => monthIncome(state, prevYm), [state, prevYm]);
  const prevExpense = useMemo(() => monthExpense(state, prevYm), [state, prevYm]);
  const savings = income - expense;
  const inv = useMemo(() => investmentTotals(state), [state]);
  const series = useMemo(() => monthlySeries(state, 6), [state]);
  const cats = useMemo(() => categoryBreakdown(state, ym, "despesa"), [state, ym]);
  const flow = useMemo(() => dailyCashFlow(state, ym), [state, ym]);
  const bills = useMemo(() => pendingBills(state), [state]);
  const forecast = useMemo(() => forecastEndOfMonth(state), [state]);
  const score = useMemo(() => healthScore(state), [state]);
  const insights = useMemo(() => generateInsights(state), [state]);
  const recent = useMemo(
    () =>
      [...state.transactions]
        .filter((t) => t.status === "efetivada")
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 7),
    [state.transactions]
  );

  const widgets = state.widgets.length > 0 ? state.widgets : [...DEFAULT_WIDGETS];

  const pctDelta = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

  function renderWidget(id: string, index: number) {
    switch (id) {
      case "saldo":
        return (
          <StatTile
            key={id}
            index={index}
            label="Saldo atual"
            value={formatBRL(balance)}
            icon="Wallet"
            tone="green"
            hint={`${state.accounts.filter((a) => !a.archived).length} contas ativas`}
          />
        );
      case "receitas":
        return (
          <StatTile
            key={id}
            index={index}
            label="Receitas do mês"
            value={formatBRL(income)}
            icon="ArrowUpCircle"
            tone="green"
            delta={{ value: pctDelta(income, prevIncome), label: `${pctDelta(income, prevIncome) >= 0 ? "+" : ""}${pctDelta(income, prevIncome).toFixed(0)}% vs ${monthLabel(prevYm, true)}` }}
          />
        );
      case "despesas":
        return (
          <StatTile
            key={id}
            index={index}
            label="Despesas do mês"
            value={formatBRL(expense)}
            icon="ArrowDownCircle"
            tone="red"
            delta={{ value: -pctDelta(expense, prevExpense), label: `${pctDelta(expense, prevExpense) >= 0 ? "+" : ""}${pctDelta(expense, prevExpense).toFixed(0)}% vs ${monthLabel(prevYm, true)}` }}
          />
        );
      case "economia":
        return (
          <StatTile
            key={id}
            index={index}
            label="Economia do mês"
            value={formatBRL(savings)}
            icon="PiggyBank"
            tone={savings >= 0 ? "blue" : "red"}
            hint={income > 0 ? `${Math.round((savings / income) * 100)}% da renda` : undefined}
          />
        );
      case "investido":
        return (
          <StatTile
            key={id}
            index={index}
            label="Valor investido"
            value={formatBRL(inv.current, { compact: true })}
            icon="TrendingUp"
            tone="violet"
            delta={{ value: inv.yieldPct, label: `${inv.yieldPct >= 0 ? "+" : ""}${inv.yieldPct.toFixed(1)}% de rentabilidade` }}
          />
        );
      case "score":
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="ff-card ff-card-hover flex items-center gap-4 p-4 md:col-span-2"
          >
            <ScoreRing score={score.score} />
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Saúde financeira</p>
              <p className="text-lg font-bold">{score.label}</p>
              <p className="mt-1 text-[11px] text-slate-400">{score.parts[0]?.hint}</p>
            </div>
          </motion.div>
        );
      case "fluxo":
        return (
          <Card key={id} className="md:col-span-4">
            <CardHeader
              title={flowTab === "mensal" ? "Entradas x Saídas" : "Fluxo de caixa diário"}
              subtitle={flowTab === "mensal" ? "Últimos 6 meses" : monthLabel(ym)}
              action={
                <Tabs
                  tabs={[
                    { id: "mensal", label: "Mensal" },
                    { id: "diario", label: "Diário" },
                  ]}
                  value={flowTab}
                  onChange={setFlowTab}
                />
              }
            />
            {flowTab === "mensal" ? <IncomeExpenseChart data={series} /> : <CashFlowChart data={flow} />}
          </Card>
        );
      case "categorias":
        return (
          <Card key={id} className="md:col-span-2">
            <CardHeader title="Gastos por categoria" subtitle={monthLabel(ym)} />
            {cats.length === 0 ? (
              <EmptyState icon="Shapes" title="Sem despesas este mês" />
            ) : (
              <>
                <CategoryDonutChart data={cats} height={180} centerLabel="Despesas" />
                <div className="mt-3 space-y-2">
                  {cats.slice(0, 4).map((c) => (
                    <div key={c.category.id} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.category.color }} />
                      <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{c.category.name}</span>
                      <span className="font-semibold tabular-nums">{formatBRL(c.total, { compact: true })}</span>
                      <span className="w-9 text-right tabular-nums text-slate-400">{c.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        );
      case "contas-vencer":
        return (
          <Card key={id} className="md:col-span-3">
            <CardHeader
              title="Contas a vencer"
              subtitle={`${bills.upcoming.length} pendentes · ${bills.overdue.length} vencidas`}
              action={
                <Link href="/calendario" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Ver calendário
                </Link>
              }
            />
            <div className="space-y-1">
              {bills.overdue.slice(0, 2).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
                  <Icon name="CalendarX" className="h-4 w-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{t.description}</p>
                    <p className="text-[11px] text-rose-500">Venceu {relativeDays(t.date).toLowerCase()}</p>
                  </div>
                  <Money value={-t.amount} className="text-xs font-semibold text-rose-600 dark:text-rose-400" />
                </div>
              ))}
              {bills.upcoming.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Icon name="Calendar" className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{t.description}</p>
                    <p className="text-[11px] text-slate-400">{relativeDays(t.date)} · {formatDate(t.date)}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{formatBRL(t.amount)}</span>
                </div>
              ))}
              {bills.upcoming.length === 0 && bills.overdue.length === 0 && (
                <EmptyState icon="CalendarCheck" title="Nenhuma conta pendente" />
              )}
            </div>
          </Card>
        );
      case "movimentacoes":
        return (
          <Card key={id} className="md:col-span-3">
            <CardHeader
              title="Últimas movimentações"
              action={
                <Link href="/transacoes" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Ver todas
                </Link>
              }
            />
            <div className="space-y-1">
              {recent.map((t) => {
                const cat = state.categories.find((c) => c.id === t.categoryId);
                const isIn = t.type === "receita" || t.type === "reembolso";
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <IconCircle icon={cat?.icon ?? "CircleEllipsis"} color={t.color || cat?.color || "#64748B"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{t.description}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(t.date, "weekday")} · {cat?.name}</p>
                    </div>
                    <Money value={isIn ? t.amount : t.type === "transferencia" ? t.amount : -t.amount} signed={t.type !== "transferencia"} className="text-xs font-semibold" />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      case "meta":
        return (
          <Card key={id} className="md:col-span-3">
            <CardHeader
              title="Metas financeiras"
              action={
                <Link href="/metas" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Gerenciar
                </Link>
              }
            />
            {state.goals.length === 0 ? (
              <EmptyState icon="Flag" title="Crie sua primeira meta" />
            ) : (
              <div className="space-y-4">
                {state.goals.slice(0, 3).map((g) => {
                  const s = goalStats(g);
                  return (
                    <div key={g.id}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium">
                          <Icon name={g.icon} className="h-3.5 w-3.5" style={{ color: g.color }} />
                          {g.name}
                        </span>
                        <span className="tabular-nums text-slate-500 dark:text-slate-400">
                          {formatBRL(g.savedAmount, { compact: true })} / {formatBRL(g.targetAmount, { compact: true })} · <strong className="text-slate-700 dark:text-slate-200">{s.pct.toFixed(0)}%</strong>
                        </span>
                      </div>
                      <Progress value={s.pct} color={g.color} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      case "insights":
        return (
          <Card key={id} className="md:col-span-3">
            <CardHeader
              title={
                <span className="flex items-center gap-1.5">
                  <Icon name="Sparkles" className="h-4 w-4 text-brand-500" /> Insights automáticos
                </span>
              }
              action={
                <Link href="/assistente" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Perguntar à IA
                </Link>
              }
            />
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2.5 rounded-xl px-3 py-2.5 text-xs",
                    ins.tone === "positivo" && "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
                    ins.tone === "negativo" && "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300",
                    ins.tone === "neutro" && "bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                  )}
                >
                  <Icon name={ins.icon} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {ins.text}
                </div>
              ))}
            </div>
          </Card>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title={`Olá, ${(state.profile.name || "você").split(" ")[0]} 👋`}
        subtitle={monthLabel(ym)}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={forecast.projected >= 0 ? "green" : "red"}>
              <Icon name="Sparkles" className="h-3 w-3" />
              Projeção fim do mês: {formatBRL(forecast.projected, { compact: true })}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)}>
              <Icon name="LayoutDashboard" className="h-3.5 w-3.5" />
              Personalizar
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">{widgets.map((w, i) => renderWidget(w, i))}</div>

      {/* Personalização de widgets */}
      <Modal open={customizeOpen} onClose={() => setCustomizeOpen(false)} title="Personalizar dashboard">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Reordene ou oculte os cartões do seu dashboard.
        </p>
        <div className="space-y-1.5">
          {DEFAULT_WIDGETS.map((id) => {
            const pos = widgets.indexOf(id);
            const visible = pos !== -1;
            return (
              <div key={id} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                <span className="flex-1 text-sm">{WIDGET_LABELS[id]}</span>
                {visible && (
                  <>
                    <button
                      aria-label="Mover para cima"
                      disabled={pos === 0}
                      onClick={() => {
                        const next = [...widgets];
                        [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
                        dispatch({ type: "SET_WIDGETS", widgets: next });
                      }}
                      className="ff-focus rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                    >
                      <Icon name="ChevronLeft" className="h-4 w-4 rotate-90" />
                    </button>
                    <button
                      aria-label="Mover para baixo"
                      disabled={pos === widgets.length - 1}
                      onClick={() => {
                        const next = [...widgets];
                        [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
                        dispatch({ type: "SET_WIDGETS", widgets: next });
                      }}
                      className="ff-focus rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                    >
                      <Icon name="ChevronRight" className="h-4 w-4 rotate-90" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    const next = visible ? widgets.filter((w) => w !== id) : [...widgets, id];
                    dispatch({ type: "SET_WIDGETS", widgets: next });
                  }}
                  className={cn(
                    "ff-focus rounded-lg px-2 py-1 text-[11px] font-medium",
                    visible
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  )}
                >
                  {visible ? "Visível" : "Oculto"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => dispatch({ type: "SET_WIDGETS", widgets: [...DEFAULT_WIDGETS] })}>
            Restaurar padrão
          </Button>
        </div>
      </Modal>
    </div>
  );
}
