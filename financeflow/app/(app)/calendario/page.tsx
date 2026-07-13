"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, EmptyState, IconCircle, Money } from "@/components/ui";
import { effectiveStatus } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Transaction } from "@/lib/types";
import { cn, currentMonth, daysInMonth, formatBRL, formatDate, monthLabel, addMonths, todayISO } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function CalendarPage() {
  const { state, dispatch } = useStore();
  const today = todayISO();
  const [ym, setYm] = useState(currentMonth());
  const [selected, setSelected] = useState<string>(today.startsWith(currentMonth()) ? today : `${currentMonth()}-01`);

  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of state.transactions) {
      if (!t.date.startsWith(ym)) continue;
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return map;
  }, [state.transactions, ym]);

  const goalDeadlines = useMemo(
    () => state.goals.filter((g) => g.deadline.startsWith(ym)),
    [state.goals, ym]
  );

  const nDays = daysInMonth(ym);
  const [y, m] = ym.split("-").map(Number);
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // segunda = 0

  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: nDays }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`),
  ];

  const selectedTxs = (byDay.get(selected) ?? []).sort((a, b) => b.amount - a.amount);
  const selGoals = state.goals.filter((g) => g.deadline === selected);

  function dayInfo(date: string) {
    const txs = byDay.get(date) ?? [];
    let inSum = 0;
    let outSum = 0;
    let hasPending = false;
    let hasOverdue = false;
    for (const t of txs) {
      if (t.type === "receita" || t.type === "reembolso") inSum += t.amount;
      else if (t.type === "despesa") outSum += t.amount;
      const st = effectiveStatus(t, today);
      if (st === "pendente") hasPending = true;
      if (st === "vencida") hasOverdue = true;
    }
    return { txs, inSum, outSum, hasPending, hasOverdue };
  }

  return (
    <div>
      <PageHeader
        title="Calendário financeiro"
        subtitle="Vencimentos, parcelas, salários e metas do mês"
        action={
          <div className="flex items-center gap-1">
            <button onClick={() => setYm(addMonths(ym, -1))} aria-label="Mês anterior" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Icon name="ChevronLeft" className="h-4 w-4" />
            </button>
            <span className="min-w-36 text-center text-sm font-semibold">{monthLabel(ym)}</span>
            <button onClick={() => setYm(addMonths(ym, 1))} aria-label="Próximo mês" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Icon name="ChevronRight" className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const info = dayInfo(date);
              const isToday = date === today;
              const isSelected = date === selected;
              const hasGoal = goalDeadlines.some((g) => g.deadline === date);
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={cn(
                    "ff-focus relative flex min-h-16 flex-col items-start rounded-xl border p-1.5 text-left transition-colors sm:min-h-20",
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                      isToday ? "bg-brand-600 text-white" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {Number(date.slice(8))}
                  </span>
                  <div className="mt-1 flex w-full flex-col gap-0.5">
                    {info.inSum > 0 && (
                      <span className="hidden truncate rounded bg-emerald-100 px-1 text-[9px] font-semibold tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 sm:block">
                        +{formatBRL(info.inSum, { compact: true })}
                      </span>
                    )}
                    {info.outSum > 0 && (
                      <span className="hidden truncate rounded bg-rose-100 px-1 text-[9px] font-semibold tabular-nums text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 sm:block">
                        −{formatBRL(info.outSum, { compact: true })}
                      </span>
                    )}
                    <span className="flex gap-0.5 sm:hidden">
                      {info.inSum > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {info.outSum > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                    </span>
                  </div>
                  <span className="absolute right-1 top-1 flex gap-0.5">
                    {info.hasOverdue && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" title="Conta vencida" />}
                    {info.hasPending && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Pendente" />}
                    {hasGoal && <Icon name="Flag" className="h-3 w-3 text-violet-500" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[10px] text-slate-400 dark:border-slate-800">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Entradas</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Saídas / vencidas</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pendentes</span>
            <span className="flex items-center gap-1"><Icon name="Flag" className="h-3 w-3 text-violet-500" /> Prazo de meta</span>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title={formatDate(selected, "long")} subtitle={`${selectedTxs.length} lançamento(s)`} />
          {selGoals.map((g) => (
            <div key={g.id} className="mb-2 flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs dark:bg-violet-500/10">
              <Icon name="Flag" className="h-4 w-4 text-violet-500" />
              <span>
                Prazo da meta <strong>{g.name}</strong>
              </span>
            </div>
          ))}
          {selectedTxs.length === 0 && selGoals.length === 0 ? (
            <EmptyState icon="Calendar" title="Nada neste dia" />
          ) : (
            <div className="space-y-1">
              {selectedTxs.map((t) => {
                const cat = state.categories.find((c) => c.id === t.categoryId);
                const isIn = t.type === "receita" || t.type === "reembolso";
                const st = effectiveStatus(t, today);
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <IconCircle icon={cat?.icon ?? "CircleEllipsis"} color={t.color || cat?.color || "#64748B"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-xs font-medium">
                        {t.description}
                        {st === "pendente" && <Badge tone="amber">Pendente</Badge>}
                        {st === "vencida" && <Badge tone="red">Vencida</Badge>}
                      </p>
                      <p className="text-[11px] text-slate-400">{cat?.name}</p>
                    </div>
                    <Money value={isIn ? t.amount : -t.amount} signed className="text-xs font-semibold" />
                    {st !== "efetivada" && (
                      <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "PAY_TRANSACTION", id: t.id })}>
                        <Icon name="Check" className="h-3.5 w-3.5" /> Pagar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
