"use client";

import { useMemo, useState } from "react";
import { CategoryDonutChart, HBarChart, IncomeExpenseChart, TrendLineChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Button, Card, CardHeader, EmptyState, Tabs } from "@/components/ui";
import { CATEGORICAL_LIGHT } from "@/lib/chart-colors";
import { categoryBreakdown, filterTransactions, monthlySeries } from "@/lib/finance";
import { exportCSV, exportExcel, exportPDF } from "@/lib/importexport";
import { useStore } from "@/lib/store";
import { addMonths, currentMonth, formatBRL, monthLabel } from "@/lib/utils";

const TABS = [
  { id: "fluxo", label: "Fluxo de caixa" },
  { id: "categorias", label: "Por categoria" },
  { id: "patrimonio", label: "Evolução patrimonial" },
  { id: "comparativo", label: "Comparativos" },
  { id: "origens", label: "Cartões · Bancos · Pgto." },
];

export default function ReportsPage() {
  const { state } = useStore();
  const [tab, setTab] = useState("fluxo");
  const [ym, setYm] = useState(currentMonth());

  const series12 = useMemo(() => monthlySeries(state, 12, currentMonth()), [state]);
  const expenseCats = useMemo(() => categoryBreakdown(state, ym, "despesa"), [state, ym]);
  const incomeCats = useMemo(() => categoryBreakdown(state, ym, "receita"), [state, ym]);

  const patrimonio = useMemo(() => {
    let acc = 0;
    return series12.map((p) => {
      acc += p.saldo;
      return { label: monthLabel(p.ym, true), value: acc };
    });
  }, [series12]);

  const monthTxs = useMemo(
    () => filterTransactions(state, { from: `${ym}-01`, to: `${ym}-31` }),
    [state, ym]
  );

  const byCard = useMemo(() => {
    return state.cards
      .map((card, i) => ({
        name: card.name,
        value: monthTxs.filter((t) => t.cardId === card.id && t.type === "despesa").reduce((s, t) => s + t.amount, 0),
        color: CATEGORICAL_LIGHT[i % CATEGORICAL_LIGHT.length],
      }))
      .filter((r) => r.value > 0);
  }, [state.cards, monthTxs]);

  const byBank = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxs.filter((t) => t.type === "despesa")) {
      const acc = state.accounts.find((a) => a.id === t.accountId);
      const key = acc?.bank || acc?.name || "Outros";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: CATEGORICAL_LIGHT[i % CATEGORICAL_LIGHT.length] }));
  }, [state.accounts, monthTxs]);

  const byPayment = useMemo(() => {
    const labels: Record<string, string> = { pix: "Pix", credito: "Crédito", debito: "Débito", dinheiro: "Dinheiro", boleto: "Boleto", transferencia: "Transferência" };
    const map = new Map<string, number>();
    for (const t of monthTxs.filter((t) => t.type === "despesa")) {
      map.set(t.paymentMethod, (map.get(t.paymentMethod) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, value], i) => ({ name: labels[k] ?? k, value, color: CATEGORICAL_LIGHT[i % CATEGORICAL_LIGHT.length] }));
  }, [monthTxs]);

  // Comparativo anual: agrupa por ano
  const yearly = useMemo(() => {
    const map = new Map<string, { receitas: number; despesas: number }>();
    for (const t of state.transactions) {
      if (t.status !== "efetivada") continue;
      const y = t.date.slice(0, 4);
      const cur = map.get(y) ?? { receitas: 0, despesas: 0 };
      if (t.type === "receita" || t.type === "reembolso") cur.receitas += t.amount;
      else if (t.type === "despesa") cur.despesas += t.amount;
      map.set(y, cur);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [state.transactions]);

  function printPDF() {
    const rows = monthTxs
      .map((t) => {
        const cat = state.categories.find((c) => c.id === t.categoryId)?.name ?? "";
        const v = t.type === "despesa" ? -t.amount : t.amount;
        return `<tr><td>${t.date.split("-").reverse().join("/")}</td><td>${t.description}</td><td>${cat}</td><td class="${v < 0 ? "neg" : "pos"}">${formatBRL(v)}</td></tr>`;
      })
      .join("");
    exportPDF(
      `FinanceFlow — Relatório de ${monthLabel(ym)}`,
      `<table><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>${rows}</table>`
    );
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        subtitle="Análises automáticas e exportação"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printPDF}>
              <Icon name="Download" className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(state, monthTxs, `financeflow-${ym}.xls`)}>
              <Icon name="Download" className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(state, monthTxs, `financeflow-${ym}.csv`)}>
              <Icon name="Download" className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        <div className="flex items-center gap-1">
          <button onClick={() => setYm(addMonths(ym, -1))} aria-label="Mês anterior" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold">{monthLabel(ym)}</span>
          <button
            onClick={() => setYm(addMonths(ym, 1))}
            disabled={ym >= currentMonth()}
            aria-label="Próximo mês"
            className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
          >
            <Icon name="ChevronRight" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tab === "fluxo" && (
        <Card>
          <CardHeader title="Fluxo de caixa mensal" subtitle="Últimos 12 meses — receitas x despesas" />
          <IncomeExpenseChart data={series12} height={320} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 dark:border-slate-800">
                  <th className="py-2 font-medium">Mês</th>
                  <th className="py-2 text-right font-medium">Receitas</th>
                  <th className="py-2 text-right font-medium">Despesas</th>
                  <th className="py-2 text-right font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {[...series12].reverse().slice(0, 6).map((p) => (
                  <tr key={p.ym} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-2">{monthLabel(p.ym)}</td>
                    <td className="py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatBRL(p.receitas)}</td>
                    <td className="py-2 text-right tabular-nums text-rose-600 dark:text-rose-400">{formatBRL(p.despesas)}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${p.saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {formatBRL(p.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "categorias" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Despesas por categoria" subtitle={monthLabel(ym)} />
            {expenseCats.length === 0 ? (
              <EmptyState icon="Shapes" title="Sem despesas no período" />
            ) : (
              <>
                <CategoryDonutChart data={expenseCats} centerLabel="Despesas" />
                <div className="mt-3 space-y-2">
                  {expenseCats.map((c) => (
                    <div key={c.category.id} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.category.color }} />
                      <span className="flex-1 truncate">{c.category.name}</span>
                      <span className="tabular-nums text-slate-400">{c.count}x</span>
                      <span className="w-20 text-right font-semibold tabular-nums">{formatBRL(c.total)}</span>
                      <span className="w-10 text-right tabular-nums text-slate-400">{c.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
          <Card>
            <CardHeader title="Receitas por categoria" subtitle={monthLabel(ym)} />
            {incomeCats.length === 0 ? (
              <EmptyState icon="Banknote" title="Sem receitas no período" />
            ) : (
              <>
                <CategoryDonutChart data={incomeCats} centerLabel="Receitas" />
                <div className="mt-3 space-y-2">
                  {incomeCats.map((c) => (
                    <div key={c.category.id} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.category.color }} />
                      <span className="flex-1 truncate">{c.category.name}</span>
                      <span className="w-20 text-right font-semibold tabular-nums">{formatBRL(c.total)}</span>
                      <span className="w-10 text-right tabular-nums text-slate-400">{c.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {tab === "patrimonio" && (
        <Card>
          <CardHeader title="Evolução patrimonial" subtitle="Resultado acumulado dos últimos 12 meses" />
          <TrendLineChart data={patrimonio} height={320} name="Acumulado" />
        </Card>
      )}

      {tab === "comparativo" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Comparativo mensal" subtitle="Mês selecionado x anterior" />
            {(() => {
              const cur = series12.find((p) => p.ym === ym);
              const prev = series12.find((p) => p.ym === addMonths(ym, -1));
              if (!cur) return <EmptyState icon="BarChart3" title="Sem dados" />;
              const rows = [
                { label: "Receitas", a: prev?.receitas ?? 0, b: cur.receitas },
                { label: "Despesas", a: prev?.despesas ?? 0, b: cur.despesas },
                { label: "Resultado", a: prev?.saldo ?? 0, b: cur.saldo },
              ];
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-medium text-slate-400">
                    <span />
                    <span className="text-right">{prev ? monthLabel(prev.ym, true) : "—"}</span>
                    <span className="text-right">{monthLabel(cur.ym, true)}</span>
                    <span className="text-right">Variação</span>
                  </div>
                  {rows.map((r) => {
                    const delta = r.a !== 0 ? ((r.b - r.a) / Math.abs(r.a)) * 100 : 0;
                    return (
                      <div key={r.label} className="grid grid-cols-4 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-slate-800/60">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-right tabular-nums text-slate-500">{formatBRL(r.a)}</span>
                        <span className="text-right font-semibold tabular-nums">{formatBRL(r.b)}</span>
                        <span className={`text-right font-semibold tabular-nums ${delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {delta >= 0 ? "+" : ""}{delta.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
          <Card>
            <CardHeader title="Comparativo anual" subtitle="Totais por ano" />
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-[11px] font-medium text-slate-400">
                <span>Ano</span>
                <span className="text-right">Receitas</span>
                <span className="text-right">Despesas</span>
                <span className="text-right">Resultado</span>
              </div>
              {yearly.map(([year, v]) => (
                <div key={year} className="grid grid-cols-4 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-slate-800/60">
                  <span className="font-medium">{year}</span>
                  <span className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatBRL(v.receitas)}</span>
                  <span className="text-right tabular-nums text-rose-600 dark:text-rose-400">{formatBRL(v.despesas)}</span>
                  <span className={`text-right font-semibold tabular-nums ${v.receitas - v.despesas >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatBRL(v.receitas - v.despesas)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "origens" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Gastos por cartão" subtitle={monthLabel(ym)} />
            {byCard.length > 0 ? <HBarChart data={byCard} /> : <EmptyState icon="CreditCard" title="Sem gastos no cartão" />}
          </Card>
          <Card>
            <CardHeader title="Gastos por banco" subtitle={monthLabel(ym)} />
            {byBank.length > 0 ? <HBarChart data={byBank} /> : <EmptyState icon="Landmark" title="Sem dados" />}
          </Card>
          <Card>
            <CardHeader title="Por forma de pagamento" subtitle={monthLabel(ym)} />
            {byPayment.length > 0 ? <HBarChart data={byPayment} /> : <EmptyState icon="Banknote" title="Sem dados" />}
          </Card>
        </div>
      )}
    </div>
  );
}
