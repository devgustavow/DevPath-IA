"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, ConfirmDialog, Field, Input, Modal, Money, Select } from "@/components/ui";
import { accountBalance } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Account, AccountKind } from "@/lib/types";
import { cn, formatBRL, uid } from "@/lib/utils";

const KIND_LABEL: Record<AccountKind, string> = {
  carteira: "Carteira",
  corrente: "Conta corrente",
  poupanca: "Poupança",
  pagamento: "Conta de pagamento",
  dinheiro: "Dinheiro físico",
  pj: "Conta PJ",
};
const ACCOUNT_ICONS = ["Landmark", "Wallet", "Banknote", "Briefcase", "PiggyBank", "CreditCard"];
const ACCOUNT_COLORS = ["#8B5CF6", "#EA580C", "#16A34A", "#2563EB", "#DB2777", "#0D9488", "#64748B", "#E11D48"];

export default function AccountsPage() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("corrente");
  const [bank, setBank] = useState("");
  const [agency, setAgency] = useState("");
  const [number, setNumber] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState("Landmark");
  const [initialBalance, setInitialBalance] = useState("");

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of state.accounts) map.set(a.id, accountBalance(state, a.id));
    return map;
  }, [state]);
  const total = Array.from(balances.entries())
    .filter(([id]) => !state.accounts.find((a) => a.id === id)?.archived)
    .reduce((s, [, v]) => s + v, 0);

  function openForm(acc?: Account) {
    setEditing(acc ?? null);
    setName(acc?.name ?? "");
    setKind(acc?.kind ?? "corrente");
    setBank(acc?.bank ?? "");
    setAgency(acc?.agency ?? "");
    setNumber(acc?.number ?? "");
    setColor(acc?.color ?? ACCOUNT_COLORS[0]);
    setIcon(acc?.icon ?? "Landmark");
    setInitialBalance(acc ? String(acc.initialBalance).replace(".", ",") : "");
    setOpen(true);
  }

  function save() {
    if (!name.trim()) return;
    dispatch({
      type: "UPSERT_ACCOUNT",
      item: {
        id: editing?.id ?? uid("acc"),
        name: name.trim(),
        kind,
        bank: bank.trim() || undefined,
        agency: agency.trim() || undefined,
        number: number.trim() || undefined,
        color,
        icon,
        initialBalance: parseFloat(initialBalance.replace(/\./g, "").replace(",", ".")) || 0,
        archived: editing?.archived,
      },
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Contas"
        subtitle={`Saldo total: ${formatBRL(total)}`}
        action={
          <Button size="sm" onClick={() => openForm()}>
            <Icon name="Plus" className="h-3.5 w-3.5" /> Nova conta
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.accounts.map((a) => {
          const bal = balances.get(a.id) ?? 0;
          return (
            <Card key={a.id} className={cn("ff-card-hover group relative overflow-hidden p-5", a.archived && "opacity-60")}>
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: a.color }} />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: a.color }}>
                    <Icon name={a.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{a.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {KIND_LABEL[a.kind]}
                      {a.bank ? ` · ${a.bank}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openForm(a)} aria-label="Editar" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="Pencil" className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(a)} aria-label="Excluir" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                    <Icon name="Trash2" className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight">
                <Money value={bal} />
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                {a.agency && <span>Ag. {a.agency}</span>}
                {a.number && <span>Conta {a.number}</span>}
                {a.archived && <Badge>Arquivada</Badge>}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar conta" : "Nova conta"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank" />
            </Field>
            <Field label="Tipo">
              <Select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
                {Object.entries(KIND_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Banco">
              <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Opcional" />
            </Field>
            <Field label="Saldo inicial (R$)">
              <Input inputMode="decimal" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Agência">
              <Input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="Opcional" />
            </Field>
            <Field label="Número">
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Opcional" />
            </Field>
          </div>
          <Field label="Ícone">
            <div className="flex gap-1.5">
              {ACCOUNT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    "ff-focus flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    icon === i ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "border-slate-200 text-slate-400 dark:border-slate-700"
                  )}
                >
                  <Icon name={i} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Cor">
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => (
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
          <Button onClick={save} disabled={!name.trim()}>
            <Icon name="Check" className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: "DELETE_ACCOUNT", id: deleting.id })}
        title="Excluir conta"
        message={`Tem certeza que deseja excluir a conta "${deleting?.name}"? As transações associadas permanecerão no histórico.`}
      />
    </div>
  );
}
