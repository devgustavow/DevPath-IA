"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconCircle, Input, Modal, Progress, Select, Switch } from "@/components/ui";
import { budgetStatus } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { TripBudget } from "@/lib/types";
import { cn, currentMonth, daysInMonth, formatBRL, monthLabel, parseISODate, todayISO, uid } from "@/lib/utils";

export default function BudgetPage() {
  const { state, dispatch } = useStore();
  const ym = currentMonth();
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");
  const [tripOpen, setTripOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripBudget | null>(null);
  const [tripName, setTripName] = useState("");
  const [tripCurrency, setTripCurrency] = useState("BRL");
  const [tripBudget, setTripBudget] = useState("");
  const [tripSpent, setTripSpent] = useState("");

  const budgets = useMemo(() => budgetStatus(state, ym), [state, ym]);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overCount = budgets.filter((b) => b.pct > 100).length;
  const warnCount = budgets.filter((b) => b.pct > 80 && b.pct <= 100).length;

  const dayNum = parseISODate(todayISO()).getDate();
  const monthPct = (dayNum / daysInMonth(ym)) * 100;

  const noBudget = state.categories.filter((c) => (!c.budget || c.budget <= 0) && c.type !== "receita");

  function saveBudget() {
    const cat = state.categories.find((c) => c.id === editCatId);
    if (!cat) return;
    const v = parseFloat(budgetValue.replace(/\./g, "").replace(",", "."));
    dispatch({ type: "UPSERT_CATEGORY", item: { ...cat, budget: isNaN(v) || v <= 0 ? undefined : v } });
    setEditCatId(null);
  }

  function openTripForm(t?: TripBudget) {
    setEditingTrip(t ?? null);
    setTripName(t?.name ?? "");
    setTripCurrency(t?.currency ?? "BRL");
    setTripBudget(t ? String(t.budget) : "");
    setTripSpent(t ? String(t.spent) : "0");
    setTripOpen(true);
  }

  function saveTrip() {
    const b = parseFloat(tripBudget.replace(/\./g, "").replace(",", "."));
    if (!tripName.trim() || isNaN(b) || b <= 0) return;
    dispatch({
      type: "UPSERT_TRIP",
      item: {
        id: editingTrip?.id ?? uid("trip"),
        name: tripName.trim(),
        currency: tripCurrency,
        budget: b,
        spent: parseFloat(tripSpent.replace(/\./g, "").replace(",", ".")) || 0,
        active: editingTrip?.active ?? true,
      },
    });
    setTripOpen(false);
  }

  const fmtCur = (v: number, cur: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur }).format(v);

  return (
    <div>
      <PageHeader
        title="Planejamento financeiro"
        subtitle={`${monthLabel(ym)} · orçamento total: ${formatBRL(totalBudget)}`}
      />

      {/* Resumo */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Utilizado</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatBRL(totalSpent)} <span className="text-sm font-normal text-slate-400">de {formatBRL(totalBudget)}</span>
            </p>
          </div>
          <div className="min-w-48 flex-1">
            <div className="mb-1 flex justify-between text-[11px] text-slate-400">
              <span>{((totalSpent / (totalBudget || 1)) * 100).toFixed(0)}% do orçamento</span>
              <span>{monthPct.toFixed(0)}% do mês decorrido</span>
            </div>
            <div className="relative">
              <Progress value={(totalSpent / (totalBudget || 1)) * 100} color={totalSpent > totalBudget ? "#E11D48" : "#22C55E"} className="h-3" />
              <div
                className="absolute top-[-3px] h-[18px] w-0.5 rounded bg-slate-400 dark:bg-slate-500"
                style={{ left: `${monthPct}%` }}
                title="Ponto ideal para hoje"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {overCount > 0 && <Badge tone="red"><Icon name="AlertTriangle" className="h-3 w-3" /> {overCount} estourado(s)</Badge>}
            {warnCount > 0 && <Badge tone="amber">{warnCount} perto do limite</Badge>}
            {overCount === 0 && warnCount === 0 && <Badge tone="green"><Icon name="Check" className="h-3 w-3" /> Tudo sob controle</Badge>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Orçamentos por categoria */}
        <Card className="lg:col-span-2">
          <CardHeader title="Orçamento por categoria" subtitle="Valor utilizado, restante e alertas" />
          {budgets.length === 0 ? (
            <EmptyState icon="Target" title="Nenhum orçamento definido" description="Defina limites mensais nas categorias abaixo." />
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => (
                <div key={b.category.id} className="group">
                  <div className="mb-1.5 flex items-center gap-2">
                    <IconCircle icon={b.category.icon} color={b.category.color} size="sm" />
                    <span className="flex-1 text-sm font-medium">{b.category.name}</span>
                    {b.pct > 100 && <Badge tone="red">Estourado</Badge>}
                    {b.pct > 80 && b.pct <= 100 && <Badge tone="amber">{b.pct.toFixed(0)}%</Badge>}
                    <button
                      onClick={() => { setEditCatId(b.category.id); setBudgetValue(String(b.budget)); }}
                      aria-label={`Editar orçamento de ${b.category.name}`}
                      className="ff-focus rounded-lg p-1 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 dark:hover:bg-slate-800"
                    >
                      <Icon name="Pencil" className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {formatBRL(b.spent)} / {formatBRL(b.budget)}
                    </span>
                  </div>
                  <Progress value={b.pct} color={b.pct > 100 ? "#E11D48" : b.pct > 80 ? "#D97706" : b.category.color} />
                  <p className={cn("mt-1 text-[11px]", b.remaining >= 0 ? "text-slate-400" : "text-rose-500")}>
                    {b.remaining >= 0
                      ? `Restam ${formatBRL(b.remaining)} (${(100 - b.pct).toFixed(0)}%)`
                      : `${formatBRL(-b.remaining)} acima do limite`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {noBudget.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Sem orçamento definido:</p>
              <div className="flex flex-wrap gap-1.5">
                {noBudget.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setEditCatId(c.id); setBudgetValue(""); }}
                    className="ff-focus inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
                  >
                    <Icon name={c.icon} className="h-3.5 w-3.5" style={{ color: c.color }} />
                    {c.name}
                    <Icon name="Plus" className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Modo viagem */}
        <Card className="h-fit">
          <CardHeader
            title={
              <span className="flex items-center gap-1.5">
                <Icon name="Plane" className="h-4 w-4 text-accent-500" /> Modo viagem
              </span>
            }
            subtitle="Orçamentos específicos por viagem e moeda"
            action={
              <Button size="sm" variant="outline" onClick={() => openTripForm()}>
                <Icon name="Plus" className="h-3.5 w-3.5" />
              </Button>
            }
          />
          {state.trips.length === 0 ? (
            <EmptyState icon="Luggage" title="Nenhuma viagem" description="Crie um orçamento de viagem com moeda própria." />
          ) : (
            <div className="space-y-3">
              {state.trips.map((t) => {
                const pct = (t.spent / t.budget) * 100;
                return (
                  <div key={t.id} className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 truncate text-sm font-semibold">{t.name}</p>
                      <Badge tone={t.active ? "blue" : "neutral"}>{t.currency}</Badge>
                      <Switch checked={t.active} onChange={(v) => dispatch({ type: "UPSERT_TRIP", item: { ...t, active: v } })} label={`Ativar ${t.name}`} />
                    </div>
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                        <span>{fmtCur(t.spent, t.currency)} gastos</span>
                        <span>{fmtCur(t.budget, t.currency)}</span>
                      </div>
                      <Progress value={pct} color={pct > 100 ? "#E11D48" : "#3B82F6"} />
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      <button onClick={() => openTripForm(t)} aria-label="Editar" className="ff-focus rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Icon name="Pencil" className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => dispatch({ type: "DELETE_TRIP", id: t.id })} aria-label="Excluir" className="ff-focus rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                        <Icon name="Trash2" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Editar orçamento */}
      <Modal open={!!editCatId} onClose={() => setEditCatId(null)} title={`Orçamento — ${state.categories.find((c) => c.id === editCatId)?.name ?? ""}`}>
        <Field label="Limite mensal (R$)">
          <Input inputMode="decimal" value={budgetValue} onChange={(e) => setBudgetValue(e.target.value)} placeholder="Deixe vazio para remover" autoFocus />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditCatId(null)}>Cancelar</Button>
          <Button onClick={saveBudget}>
            <Icon name="Check" className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </Modal>

      {/* Form viagem */}
      <Modal open={tripOpen} onClose={() => setTripOpen(false)} title={editingTrip ? "Editar viagem" : "Nova viagem"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2">
            <Input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Ex.: Chile — Jan/2027" />
          </Field>
          <Field label="Moeda">
            <Select value={tripCurrency} onChange={(e) => setTripCurrency(e.target.value)}>
              {["BRL", "USD", "EUR", "ARS", "CLP", "GBP", "JPY"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Orçamento">
            <Input inputMode="decimal" value={tripBudget} onChange={(e) => setTripBudget(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Já gasto" className="col-span-2">
            <Input inputMode="decimal" value={tripSpent} onChange={(e) => setTripSpent(e.target.value)} placeholder="0,00" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setTripOpen(false)}>Cancelar</Button>
          <Button onClick={saveTrip}>
            <Icon name="Check" className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
