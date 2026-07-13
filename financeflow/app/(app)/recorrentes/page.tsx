"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, IconCircle, Input, Modal, Select, Switch } from "@/components/ui";
import { detectSubscriptions } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { RecurringBill, Transaction } from "@/lib/types";
import { formatBRL, monthOf, toISODate, todayISO, uid } from "@/lib/utils";

export default function RecurringPage() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringBill | null>(null);
  const [deleting, setDeleting] = useState<RecurringBill | null>(null);
  const [generated, setGenerated] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? "");
  const [cardId, setCardId] = useState("");
  const [day, setDay] = useState("5");
  const [type, setType] = useState<"receita" | "despesa">("despesa");

  const subscriptions = useMemo(() => detectSubscriptions(state), [state]);
  const totalMonthly = state.recurring.filter((r) => r.active && r.type === "despesa").reduce((s, r) => s + r.amount, 0);
  const totalIncome = state.recurring.filter((r) => r.active && r.type === "receita").reduce((s, r) => s + r.amount, 0);

  function openForm(rec?: RecurringBill) {
    setEditing(rec ?? null);
    setName(rec?.name ?? "");
    setAmount(rec ? String(rec.amount).replace(".", ",") : "");
    setCategoryId(rec?.categoryId ?? "");
    setAccountId(rec?.accountId ?? state.accounts[0]?.id ?? "");
    setCardId(rec?.cardId ?? "");
    setDay(String(rec?.dayOfMonth ?? 5));
    setType(rec?.type ?? "despesa");
    setOpen(true);
  }

  function save() {
    const value = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (!name.trim() || isNaN(value) || value <= 0 || !categoryId) return;
    const cat = state.categories.find((c) => c.id === categoryId);
    dispatch({
      type: "UPSERT_RECURRING",
      item: {
        id: editing?.id ?? uid("rec"),
        name: name.trim(),
        amount: value,
        categoryId,
        accountId,
        cardId: cardId || undefined,
        dayOfMonth: Number(day),
        type,
        active: editing?.active ?? true,
        icon: cat?.icon ?? "Repeat",
      },
    });
    setOpen(false);
  }

  /** Gera lançamentos pendentes dos próximos 3 meses para todas as recorrências ativas */
  function generateUpcoming() {
    const today = todayISO();
    const [y, m] = today.split("-").map(Number);
    const items: Transaction[] = [];
    for (const rec of state.recurring.filter((r) => r.active)) {
      for (let i = 0; i < 3; i++) {
        const d = new Date(y, m - 1 + i, rec.dayOfMonth);
        const iso = toISODate(d);
        if (iso <= today) continue;
        const exists = state.transactions.some((t) => t.recurringId === rec.id && monthOf(t.date) === monthOf(iso));
        if (exists) continue;
        items.push({
          id: uid("tx"),
          type: rec.type,
          amount: rec.amount,
          description: rec.name,
          categoryId: rec.categoryId,
          accountId: rec.accountId,
          cardId: rec.cardId,
          paymentMethod: rec.cardId ? "credito" : rec.type === "receita" ? "transferencia" : "boleto",
          date: iso,
          tags: [],
          recurringId: rec.id,
          status: "pendente",
          createdAt: today,
        });
      }
    }
    if (items.length > 0) dispatch({ type: "ADD_TRANSACTIONS", items });
    setGenerated(items.length);
    setTimeout(() => setGenerated(null), 4000);
  }

  return (
    <div>
      <PageHeader
        title="Contas recorrentes"
        subtitle={`Despesas fixas: ${formatBRL(totalMonthly)}/mês · Receitas fixas: ${formatBRL(totalIncome)}/mês`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateUpcoming}>
              <Icon name="Sparkles" className="h-3.5 w-3.5" /> Gerar lançamentos futuros
            </Button>
            <Button size="sm" onClick={() => openForm()}>
              <Icon name="Plus" className="h-3.5 w-3.5" /> Nova recorrência
            </Button>
          </div>
        }
      />

      {generated !== null && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {generated > 0
            ? `${generated} lançamentos futuros gerados como pendentes (próximos 3 meses).`
            : "Todos os lançamentos dos próximos 3 meses já estão gerados."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Suas recorrências" subtitle="O sistema gera os lançamentos futuros automaticamente" />
          {state.recurring.length === 0 ? (
            <EmptyState icon="Repeat" title="Nenhuma conta recorrente" description="Cadastre Netflix, aluguel, academia…" />
          ) : (
            <div className="space-y-1">
              {[...state.recurring]
                .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
                .map((r) => {
                  const cat = state.categories.find((c) => c.id === r.categoryId);
                  const card = state.cards.find((c) => c.id === r.cardId);
                  return (
                    <div key={r.id} className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <IconCircle icon={r.icon} color={cat?.color ?? "#64748B"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <p className="text-[11px] text-slate-400">
                          Todo dia {r.dayOfMonth} · {cat?.name}
                          {card ? ` · ${card.name}` : ""}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${r.type === "receita" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {r.type === "receita" ? "+" : ""}{formatBRL(r.amount)}
                      </span>
                      <Switch
                        checked={r.active}
                        onChange={(v) => dispatch({ type: "UPSERT_RECURRING", item: { ...r, active: v } })}
                        label={`Ativar ${r.name}`}
                      />
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openForm(r)} aria-label="Editar" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Icon name="Pencil" className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(r)} aria-label="Excluir" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                          <Icon name="Trash2" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-1.5">
                <Icon name="Sparkles" className="h-4 w-4 text-brand-500" /> Assinaturas detectadas
              </span>
            }
            subtitle="Pagamentos recorrentes identificados automaticamente"
          />
          <div className="space-y-2">
            {subscriptions.slice(0, 8).map((s) => {
              const cat = state.categories.find((c) => c.id === s.categoryId);
              return (
                <div key={s.description} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <IconCircle icon={cat?.icon ?? "Repeat"} color={cat?.color ?? "#7C3AED"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{s.description}</p>
                    <p className="text-[10px] text-slate-400">{s.months} meses seguidos</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{formatBRL(s.amount)}</span>
                </div>
              );
            })}
            {subscriptions.length === 0 && <EmptyState icon="Search" title="Nada detectado ainda" />}
          </div>
          {subscriptions.length > 0 && (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              Total estimado: <strong>{formatBRL(subscriptions.filter((s) => s.amount < 500).reduce((x, s) => x + s.amount, 0))}/mês</strong> em pagamentos recorrentes.
            </p>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar recorrência" : "Nova recorrência"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Netflix" />
          </Field>
          <Field label="Valor (R$)">
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Dia do mês">
            <Input type="number" min={1} max={28} value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <Select value={type} onChange={(e) => setType(e.target.value as "receita" | "despesa")}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </Select>
          </Field>
          <Field label="Categoria">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Selecione…</option>
              {state.categories
                .filter((c) => (type === "receita" ? c.type !== "despesa" : c.type !== "receita"))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Conta">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cartão (opcional)">
            <Select value={cardId} onChange={(e) => setCardId(e.target.value)}>
              <option value="">Nenhum</option>
              {state.cards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
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
        onConfirm={() => deleting && dispatch({ type: "DELETE_RECURRING", id: deleting.id })}
        title="Excluir recorrência"
        message={`Excluir "${deleting?.name}"? Lançamentos já gerados permanecem no histórico.`}
      />
    </div>
  );
}
