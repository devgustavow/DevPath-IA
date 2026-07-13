"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { TransactionFormModal } from "@/components/transaction-form";
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconCircle, Modal, Money, Select } from "@/components/ui";
import { filterTransactions, periodRange, type PeriodPreset } from "@/lib/finance";
import { exportCSV, exportExcel, parseStatement, rowsToTransactions, type ParsedRow } from "@/lib/importexport";
import { useStore } from "@/lib/store";
import { Transaction } from "@/lib/types";
import { cn, formatBRL, formatDate } from "@/lib/utils";

const PERIODS: { id: PeriodPreset | "custom"; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mês" },
  { id: "30dias", label: "Últimos 30 dias" },
  { id: "ano", label: "Este ano" },
  { id: "tudo", label: "Tudo" },
];

const TYPE_LABEL: Record<Transaction["type"], string> = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
  reembolso: "Reembolso",
};

function TransactionsInner() {
  const { state, dispatch } = useStore();
  const params = useSearchParams();
  const [text, setText] = useState(params.get("q") ?? "");
  const [period, setPeriod] = useState<PeriodPreset>("mes");
  const [type, setType] = useState<string>("todas");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ParsedRow[]>([]);
  const [importAccount, setImportAccount] = useState(state.accounts[0]?.id ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const range = periodRange(period);
  const filtered = useMemo(
    () =>
      filterTransactions(state, {
        text,
        type: type as Transaction["type"] | "todas",
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        paymentMethod: paymentMethod || undefined,
        ...range,
      }),
    [state, text, type, categoryId, accountId, paymentMethod, range.from, range.to] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const totalIn = filtered.filter((t) => t.type === "receita" || t.type === "reembolso").reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);

  // Agrupa por data
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseStatement(file.name, String(reader.result ?? ""));
      setImportRows(rows);
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    const items = rowsToTransactions(importRows, importAccount, state);
    dispatch({ type: "ADD_TRANSACTIONS", items });
    setImportRows([]);
    setImportOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        subtitle={`${filtered.length} lançamentos · Entradas ${formatBRL(totalIn)} · Saídas ${formatBRL(totalOut)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Icon name="Upload" className="h-3.5 w-3.5" /> Importar
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(state, filtered)}>
              <Icon name="Download" className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(state, filtered)}>
              <Icon name="Download" className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Icon name="Plus" className="h-3.5 w-3.5" /> Nova
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <Card className="mb-4 p-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodPreset)}
              className={cn(
                "ff-focus rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="relative col-span-2 sm:col-span-1">
            <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Buscar…"
              className="ff-focus h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <Select className="h-9 text-xs" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="todas">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
            <option value="transferencia">Transferências</option>
            <option value="reembolso">Reembolsos</option>
          </Select>
          <Select className="h-9 text-xs" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Todas as categorias</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select className="h-9 text-xs" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Todas as contas</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
          <Select className="h-9 text-xs" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">Toda forma de pgto.</option>
            <option value="pix">Pix</option>
            <option value="credito">Crédito</option>
            <option value="debito">Débito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">Transferência</option>
          </Select>
        </div>
      </Card>

      {/* Lista */}
      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon="Search"
            title="Nenhuma transação encontrada"
            description="Ajuste os filtros ou cadastre uma nova transação."
            action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>Nova transação</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, txs]) => (
            <div key={date}>
              <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {formatDate(date, "weekday")}
              </p>
              <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
                {txs.map((t) => {
                  const cat = state.categories.find((c) => c.id === t.categoryId);
                  const acc = state.accounts.find((a) => a.id === t.accountId);
                  const card = state.cards.find((c) => c.id === t.cardId);
                  const isIn = t.type === "receita" || t.type === "reembolso";
                  return (
                    <div key={t.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <IconCircle icon={cat?.icon ?? "ArrowLeftRight"} color={t.color || cat?.color || "#64748B"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                          <span className="truncate">{t.description}</span>
                          {t.status === "pendente" && <Badge tone="amber">Pendente</Badge>}
                          {t.status === "vencida" && <Badge tone="red">Vencida</Badge>}
                          {t.installments && <Badge tone="blue">{t.installments.current}/{t.installments.total}</Badge>}
                          {t.attachment && <Icon name="Paperclip" className="h-3 w-3 text-slate-400" />}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {cat?.name}
                          {t.subcategory ? ` › ${t.subcategory}` : ""} · {card ? card.name : acc?.name} · {TYPE_LABEL[t.type]}
                          {t.tags.length > 0 && ` · ${t.tags.map((x) => `#${x}`).join(" ")}`}
                        </p>
                      </div>
                      <Money
                        value={isIn ? t.amount : t.type === "transferencia" ? t.amount : -t.amount}
                        signed={t.type !== "transferencia"}
                        className="text-sm font-semibold"
                      />
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        {t.status !== "efetivada" && (
                          <button
                            title="Marcar como paga"
                            onClick={() => dispatch({ type: "PAY_TRANSACTION", id: t.id })}
                            className="ff-focus rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          >
                            <Icon name="Check" className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          title="Editar"
                          onClick={() => { setEditing(t); setFormOpen(true); }}
                          className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                          <Icon name="Pencil" className="h-4 w-4" />
                        </button>
                        <button
                          title="Excluir"
                          onClick={() => setDeleting(t)}
                          className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                        >
                          <Icon name="Trash2" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

      <TransactionFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: "DELETE_TRANSACTION", id: deleting.id })}
        title="Excluir transação"
        message={`Tem certeza que deseja excluir "${deleting?.description}"? Esta ação não pode ser desfeita.`}
      />

      {/* Importação de extrato */}
      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportRows([]); }} title="Importar extrato (OFX, QIF ou CSV)" wide>
        {importRows.length === 0 ? (
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="ff-focus flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-10 text-sm text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
            >
              <Icon name="Upload" className="h-8 w-8" />
              Clique para escolher o arquivo do seu banco
              <span className="text-xs text-slate-400">Formatos: .ofx, .qif, .csv (colunas data; descrição; valor)</span>
            </button>
            <input ref={fileRef} type="file" accept=".ofx,.qif,.csv,.txt" className="hidden" onChange={handleImportFile} />
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm">
                <strong>{importRows.length}</strong> transações encontradas — categorização automática aplicada.
              </p>
              <Select className="h-9 w-44 text-xs" value={importAccount} onChange={(e) => setImportAccount(e.target.value)}>
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              {importRows.slice(0, 50).map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs last:border-0 dark:border-slate-800">
                  <span className="text-slate-400">{r.date.split("-").reverse().join("/")}</span>
                  <span className="mx-3 flex-1 truncate">{r.description}</span>
                  <Money value={r.amount} signed className="font-semibold" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setImportRows([])}>Escolher outro arquivo</Button>
              <Button onClick={confirmImport}>
                <Icon name="Check" className="h-4 w-4" /> Importar {importRows.length}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsInner />
    </Suspense>
  );
}
