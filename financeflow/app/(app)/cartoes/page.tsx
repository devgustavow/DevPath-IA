"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, IconCircle, Input, Modal, Progress, Select } from "@/components/ui";
import { cardStats, installmentPlans } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { CardBrand, CreditCard } from "@/lib/types";
import { cn, formatBRL, formatDate, uid } from "@/lib/utils";

const BRANDS: { id: CardBrand; label: string }[] = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "elo", label: "Elo" },
  { id: "amex", label: "Amex" },
  { id: "hipercard", label: "Hipercard" },
];
const CARD_COLORS = ["#8B5CF6", "#0F172A", "#EA580C", "#16A34A", "#2563EB", "#DB2777", "#B91C1C", "#0D9488"];

export default function CardsPage() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [deleting, setDeleting] = useState<CreditCard | null>(null);
  const [detailId, setDetailId] = useState<string | null>(state.cards[0]?.id ?? null);

  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [limit, setLimit] = useState("");
  const [bestDay, setBestDay] = useState("1");
  const [closingDay, setClosingDay] = useState("28");
  const [dueDay, setDueDay] = useState("7");
  const [brand, setBrand] = useState<CardBrand>("mastercard");
  const [color, setColor] = useState(CARD_COLORS[0]);

  const stats = useMemo(() => state.cards.map((c) => cardStats(state, c)), [state]);
  const plans = useMemo(() => installmentPlans(state), [state]);
  const detail = stats.find((s) => s.card.id === detailId) ?? stats[0];

  function openForm(card?: CreditCard) {
    setEditing(card ?? null);
    setName(card?.name ?? "");
    setBank(card?.bank ?? "");
    setLimit(card ? String(card.limit) : "");
    setBestDay(String(card?.bestPurchaseDay ?? 1));
    setClosingDay(String(card?.closingDay ?? 28));
    setDueDay(String(card?.dueDay ?? 7));
    setBrand(card?.brand ?? "mastercard");
    setColor(card?.color ?? CARD_COLORS[0]);
    setOpen(true);
  }

  function save() {
    if (!name.trim() || !limit) return;
    dispatch({
      type: "UPSERT_CARD",
      item: {
        id: editing?.id ?? uid("card"),
        name: name.trim(),
        bank: bank.trim(),
        limit: parseFloat(limit.replace(/\./g, "").replace(",", ".")) || 0,
        bestPurchaseDay: Number(bestDay),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        brand,
        color,
        icon: "CreditCard",
      },
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Cartões de crédito"
        subtitle={`${state.cards.length} cartões cadastrados`}
        action={
          <Button size="sm" onClick={() => openForm()}>
            <Icon name="Plus" className="h-3.5 w-3.5" /> Novo cartão
          </Button>
        }
      />

      {/* Cartões visuais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const usedPct = s.card.limit > 0 ? (s.limitUsed / s.card.limit) * 100 : 0;
          return (
            <button
              key={s.card.id}
              onClick={() => setDetailId(s.card.id)}
              className={cn(
                "ff-focus group relative overflow-hidden rounded-2xl p-5 text-left text-white shadow-lg transition-transform hover:-translate-y-0.5",
                detailId === s.card.id && "ring-2 ring-brand-500 ring-offset-2 ring-offset-page dark:ring-offset-page-dark"
              )}
              style={{ background: `linear-gradient(135deg, ${s.card.color}, ${s.card.color}cc)` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-80">{s.card.bank}</p>
                  <p className="text-sm font-semibold">{s.card.name}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">{s.card.brand}</span>
              </div>
              <p className="mt-5 text-[11px] opacity-80">Fatura aberta</p>
              <p className="text-2xl font-bold tabular-nums">{formatBRL(s.openInvoice)}</p>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, usedPct)}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] opacity-90">
                  <span>Usado {formatBRL(s.limitUsed, { compact: true })}</span>
                  <span>Disponível {formatBRL(s.limitAvailable, { compact: true })}</span>
                </div>
              </div>
              <div
                className="absolute right-3 top-3 hidden gap-1 group-hover:flex"
                onClick={(e) => e.stopPropagation()}
              >
                <span role="button" tabIndex={0} onClick={() => openForm(s.card)} onKeyDown={(e) => e.key === "Enter" && openForm(s.card)} aria-label="Editar" className="cursor-pointer rounded-lg bg-white/20 p-1.5 hover:bg-white/30">
                  <Icon name="Pencil" className="h-3.5 w-3.5" />
                </span>
                <span role="button" tabIndex={0} onClick={() => setDeleting(s.card)} onKeyDown={(e) => e.key === "Enter" && setDeleting(s.card)} aria-label="Excluir" className="cursor-pointer rounded-lg bg-white/20 p-1.5 hover:bg-white/30">
                  <Icon name="Trash2" className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhe do cartão selecionado */}
      {detail && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader title={detail.card.name} subtitle="Resumo da fatura" />
            <div className="space-y-3 text-sm">
              {[
                { label: "Fatura aberta", value: formatBRL(detail.openInvoice) },
                { label: "Fechamento", value: formatDate(detail.cycleEnd) },
                { label: "Vencimento", value: formatDate(detail.dueDate) },
                { label: "Melhor dia de compra", value: `Dia ${detail.card.bestPurchaseDay}` },
                { label: "Limite total", value: formatBRL(detail.card.limit) },
                { label: "Limite utilizado", value: formatBRL(detail.limitUsed) },
                { label: "Limite disponível", value: formatBRL(detail.limitAvailable) },
                { label: "Parcelas futuras", value: formatBRL(detail.futureCommitted) },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 dark:border-slate-800/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="text-xs font-semibold tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Progress value={detail.card.limit > 0 ? (detail.limitUsed / detail.card.limit) * 100 : 0} color={detail.card.color} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Lançamentos da fatura aberta" subtitle={`${formatDate(detail.cycleStart)} — ${formatDate(detail.cycleEnd)}`} />
            {detail.transactions.length === 0 ? (
              <EmptyState icon="CreditCard" title="Nenhum lançamento neste ciclo" />
            ) : (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {detail.transactions.map((t) => {
                  const cat = state.categories.find((c) => c.id === t.categoryId);
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <IconCircle icon={cat?.icon ?? "CreditCard"} color={cat?.color ?? "#64748B"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-xs font-medium">
                          {t.description}
                          {t.installments && <Badge tone="blue">{t.installments.current}/{t.installments.total}</Badge>}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDate(t.date)} · {cat?.name}</p>
                      </div>
                      <span className="text-xs font-semibold tabular-nums">{formatBRL(t.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Parcelamentos */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Parcelamentos em andamento" subtitle="Controle automático de todas as compras parceladas" />
          {plans.filter((p) => p.remaining > 0).length === 0 ? (
            <EmptyState icon="Repeat" title="Nenhum parcelamento ativo" description="Compras parceladas aparecem aqui automaticamente." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {plans.filter((p) => p.remaining > 0).map((p) => {
                const cat = state.categories.find((c) => c.id === p.categoryId);
                const card = state.cards.find((c) => c.id === p.cardId);
                return (
                  <div key={p.groupId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <IconCircle icon={cat?.icon ?? "CreditCard"} color={cat?.color ?? "#64748B"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.description}</p>
                        <p className="text-[11px] text-slate-400">
                          {card?.name ?? "Sem cartão"} · termina em {formatDate(p.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">{formatBRL(p.monthlyAmount)}/mês</p>
                        <p className="text-[11px] text-slate-400">Total {formatBRL(p.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Parcela {Math.min(p.paid + 1, p.total)} de {p.total}</span>
                        <span>{p.remaining} restantes ({formatBRL(p.remaining * p.monthlyAmount)})</span>
                      </div>
                      <Progress value={(p.paid / p.total) * 100} color={cat?.color ?? "#3B82F6"} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Form */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar cartão" : "Novo cartão"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank Ultravioleta" />
          </Field>
          <Field label="Banco">
            <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ex.: Nubank" />
          </Field>
          <Field label="Limite (R$)">
            <Input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Bandeira">
            <Select value={brand} onChange={(e) => setBrand(e.target.value as CardBrand)}>
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Melhor dia de compra">
            <Input type="number" min={1} max={28} value={bestDay} onChange={(e) => setBestDay(e.target.value)} />
          </Field>
          <Field label="Dia do fechamento">
            <Input type="number" min={1} max={28} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
          </Field>
          <Field label="Dia do vencimento">
            <Input type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
          </Field>
          <Field label="Cor" className="col-span-2">
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn("ff-focus h-7 w-7 rounded-full border-2 transition-transform hover:scale-110", color === c ? "border-slate-900 dark:border-white" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!name.trim() || !limit}>
            <Icon name="Check" className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: "DELETE_CARD", id: deleting.id })}
        title="Excluir cartão"
        message={`Tem certeza que deseja excluir o cartão "${deleting?.name}"?`}
      />
    </div>
  );
}
