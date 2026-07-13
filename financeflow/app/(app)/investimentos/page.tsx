"use client";

import { useMemo, useState } from "react";
import { HBarChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, Money, Select } from "@/components/ui";
import { investmentTotals } from "@/lib/finance";
import { CATEGORICAL_LIGHT } from "@/lib/chart-colors";
import { useStore } from "@/lib/store";
import { Investment, InvestmentType } from "@/lib/types";
import { cn, formatBRL, formatPercent, uid } from "@/lib/utils";

const TYPE_LABEL: Record<InvestmentType, string> = {
  acoes: "Ações",
  fiis: "FIIs",
  tesouro: "Tesouro Direto",
  cdb: "CDB",
  lci: "LCI",
  lca: "LCA",
  cripto: "Criptomoedas",
  fundos: "Fundos/ETFs",
};

export default function InvestmentsPage() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [deleting, setDeleting] = useState<Investment | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<InvestmentType>("acoes");
  const [invested, setInvested] = useState("");
  const [current, setCurrent] = useState("");
  const [dividends, setDividends] = useState("");
  const [institution, setInstitution] = useState("");

  const totals = useMemo(() => investmentTotals(state), [state]);

  const byType = useMemo(() => {
    const map = new Map<InvestmentType, number>();
    for (const i of state.investments) map.set(i.type, (map.get(i.type) ?? 0) + i.currentValue);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t, v], idx) => ({ name: TYPE_LABEL[t], value: v, color: CATEGORICAL_LIGHT[idx % CATEGORICAL_LIGHT.length] }));
  }, [state.investments]);

  function openForm(inv?: Investment) {
    setEditing(inv ?? null);
    setName(inv?.name ?? "");
    setType(inv?.type ?? "acoes");
    setInvested(inv ? String(inv.invested) : "");
    setCurrent(inv ? String(inv.currentValue) : "");
    setDividends(inv ? String(inv.dividends) : "0");
    setInstitution(inv?.institution ?? "");
    setOpen(true);
  }

  function save() {
    const inv = parseFloat(invested.replace(/\./g, "").replace(",", "."));
    const cur = parseFloat(current.replace(/\./g, "").replace(",", "."));
    if (!name.trim() || isNaN(inv) || isNaN(cur)) return;
    dispatch({
      type: "UPSERT_INVESTMENT",
      item: {
        id: editing?.id ?? uid("inv"),
        name: name.trim(),
        type,
        invested: inv,
        currentValue: cur,
        dividends: parseFloat(dividends.replace(/\./g, "").replace(",", ".")) || 0,
        institution: institution.trim(),
      },
    });
    setOpen(false);
  }

  const tiles = [
    { label: "Patrimônio", value: formatBRL(totals.current), icon: "TrendingUp", tone: "text-brand-600 dark:text-brand-400" },
    { label: "Total aportado", value: formatBRL(totals.invested), icon: "PiggyBank", tone: "" },
    { label: "Lucro", value: formatBRL(totals.profit), icon: totals.profit >= 0 ? "TrendingUp" : "TrendingDown", tone: totals.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400" },
    { label: "Rentabilidade", value: formatPercent(totals.yieldPct), icon: "Percent", tone: totals.yieldPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400" },
    { label: "Dividendos", value: formatBRL(totals.dividends), icon: "Banknote", tone: "" },
  ];

  return (
    <div>
      <PageHeader
        title="Investimentos"
        subtitle="Acompanhe seu patrimônio e rentabilidade"
        action={
          <Button size="sm" onClick={() => openForm()}>
            <Icon name="Plus" className="h-3.5 w-3.5" /> Novo ativo
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t.label}</span>
              <Icon name={t.icon} className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            </div>
            <p className={cn("mt-1.5 text-lg font-bold tabular-nums", t.tone)}>{t.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Seus ativos" subtitle={`${state.investments.length} posições`} />
          {state.investments.length === 0 ? (
            <EmptyState icon="TrendingUp" title="Nenhum investimento" description="Cadastre ações, FIIs, Tesouro, CDB, cripto…" />
          ) : (
            <div className="space-y-1">
              {[...state.investments]
                .sort((a, b) => b.currentValue - a.currentValue)
                .map((i) => {
                  const profit = i.currentValue - i.invested;
                  const pct = i.invested > 0 ? (profit / i.invested) * 100 : 0;
                  return (
                    <div key={i.id} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {TYPE_LABEL[i.type].slice(0, 4).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{i.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {TYPE_LABEL[i.type]} · {i.institution}
                          {i.dividends > 0 && ` · Dividendos: ${formatBRL(i.dividends)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatBRL(i.currentValue)}</p>
                        <p className={cn("text-[11px] tabular-nums", profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {profit >= 0 ? "+" : ""}{formatBRL(profit)} ({formatPercent(pct)})
                        </p>
                      </div>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openForm(i)} aria-label="Editar" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Icon name="Pencil" className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(i)} aria-label="Excluir" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                          <Icon name="Trash2" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="Alocação por classe" subtitle="Distribuição do patrimônio" />
          {byType.length > 0 ? <HBarChart data={byType} /> : <EmptyState icon="BarChart3" title="Sem dados" />}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar ativo" : "Novo ativo"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: PETR4, Tesouro Selic 2029…" />
          </Field>
          <Field label="Tipo">
            <Select value={type} onChange={(e) => setType(e.target.value as InvestmentType)}>
              {Object.entries(TYPE_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Instituição">
            <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex.: XP, Binance…" />
          </Field>
          <Field label="Total aportado (R$)">
            <Input inputMode="decimal" value={invested} onChange={(e) => setInvested(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Valor atual (R$)">
            <Input inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Dividendos recebidos (R$)" className="col-span-2">
            <Input inputMode="decimal" value={dividends} onChange={(e) => setDividends(e.target.value)} placeholder="0,00" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>
            <Icon name="Check" className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: "DELETE_INVESTMENT", id: deleting.id })}
        title="Excluir ativo"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
      />
    </div>
  );
}
