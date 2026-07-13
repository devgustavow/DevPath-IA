"use client";

import React, { useEffect, useMemo, useState } from "react";
import { simulateOcr } from "@/lib/importexport";
import { useStore } from "@/lib/store";
import { PaymentMethod, Transaction, TransactionType } from "@/lib/types";
import { cn, formatBRL, parseISODate, toISODate, todayISO, uid } from "@/lib/utils";
import { Icon } from "./icons";
import { Button, Field, Input, Modal, Select, Switch, Textarea } from "./ui";

const TYPE_OPTIONS: { id: TransactionType; label: string; icon: string; color: string }[] = [
  { id: "despesa", label: "Despesa", icon: "ArrowDownCircle", color: "text-rose-500" },
  { id: "receita", label: "Receita", icon: "ArrowUpCircle", color: "text-emerald-500" },
  { id: "transferencia", label: "Transferência", icon: "ArrowLeftRight", color: "text-blue-500" },
  { id: "reembolso", label: "Reembolso", icon: "Repeat", color: "text-violet-500" },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "debito", label: "Cartão de débito" },
  { id: "credito", label: "Cartão de crédito" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "boleto", label: "Boleto" },
  { id: "transferencia", label: "Transferência" },
];

const TX_COLORS = ["", "#22C55E", "#3B82F6", "#8B5CF6", "#F43F5E", "#F59E0B", "#14B8A6", "#EC4899"];

export function TransactionFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
}) {
  const { state, dispatch } = useStore();

  const [type, setType] = useState<TransactionType>("despesa");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [cardId, setCardId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("");
  const [pending, setPending] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [nInstallments, setNInstallments] = useState(2);
  const [recurrent, setRecurrent] = useState(false);
  const [attachment, setAttachment] = useState<Transaction["attachment"]>();
  const [ocrApplied, setOcrApplied] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount).replace(".", ","));
      setDescription(editing.description);
      setCategoryId(editing.categoryId);
      setSubcategory(editing.subcategory ?? "");
      setAccountId(editing.accountId);
      setToAccountId(editing.toAccountId ?? "");
      setCardId(editing.cardId ?? "");
      setPaymentMethod(editing.paymentMethod);
      setDate(editing.date);
      setNotes(editing.notes ?? "");
      setTags(editing.tags.join(", "));
      setColor(editing.color ?? "");
      setPending(editing.status !== "efetivada");
      setInstalled(false);
      setRecurrent(false);
      setAttachment(editing.attachment);
    } else {
      setType("despesa");
      setAmount("");
      setDescription("");
      setCategoryId("");
      setSubcategory("");
      setAccountId(state.accounts[0]?.id ?? "");
      setToAccountId("");
      setCardId("");
      setPaymentMethod("pix");
      setDate(todayISO());
      setNotes("");
      setTags("");
      setColor("");
      setPending(false);
      setInstalled(false);
      setNInstallments(2);
      setRecurrent(false);
      setAttachment(undefined);
    }
    setOcrApplied(false);
  }, [open, editing, state.accounts]);

  const categories = useMemo(
    () =>
      state.categories.filter((c) =>
        type === "receita" ? c.type !== "despesa" : type === "despesa" ? c.type !== "receita" : true
      ),
    [state.categories, type]
  );
  const selectedCategory = state.categories.find((c) => c.id === categoryId);

  const parsedAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
  const valid =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    description.trim() &&
    accountId &&
    (type === "transferencia" ? toAccountId && toAccountId !== accountId : categoryId);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ocr = simulateOcr(file.name, state);
      setAttachment({
        name: file.name,
        mimeType: file.type,
        dataUrl: typeof reader.result === "string" && file.size < 300_000 ? reader.result : undefined,
        ocr,
      });
      // OCR: pré-preenche campos vazios
      if (!editing && !amount && ocr.amount) {
        setAmount(String(ocr.amount).replace(".", ","));
        if (!description && ocr.merchant) setDescription(ocr.merchant);
        if (!categoryId && ocr.suggestedCategoryId) setCategoryId(ocr.suggestedCategoryId);
        if (ocr.date) setDate(ocr.date);
        setOcrApplied(true);
      }
    };
    reader.readAsDataURL(file);
  }

  function save() {
    if (!valid) return;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const base: Omit<Transaction, "id"> = {
      type,
      amount: Math.round(parsedAmount * 100) / 100,
      description: description.trim(),
      categoryId: type === "transferencia" ? "cat-outros" : categoryId,
      subcategory: subcategory || undefined,
      accountId,
      toAccountId: type === "transferencia" ? toAccountId : undefined,
      cardId: paymentMethod === "credito" && type === "despesa" ? cardId || undefined : undefined,
      paymentMethod,
      date,
      notes: notes.trim() || undefined,
      attachment,
      tags: tagList,
      color: color || undefined,
      status: pending ? (date < todayISO() ? "vencida" : "pendente") : "efetivada",
      createdAt: todayISO(),
    };

    if (editing) {
      dispatch({ type: "UPDATE_TRANSACTION", item: { ...base, id: editing.id, installments: editing.installments } });
    } else if (installed && nInstallments >= 2 && type === "despesa") {
      // Parcelamento: divide o valor em N meses
      const groupId = uid("inst");
      const per = Math.round((base.amount / nInstallments) * 100) / 100;
      const start = parseISODate(date);
      const items: Transaction[] = [];
      for (let i = 0; i < nInstallments; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, Math.min(start.getDate(), 28));
        items.push({
          ...base,
          id: uid("tx"),
          amount: per,
          description: `${base.description} (${i + 1}/${nInstallments})`,
          date: toISODate(d),
          status: i === 0 ? base.status : "pendente",
          installments: { groupId, total: nInstallments, current: i + 1, totalAmount: base.amount },
          tags: Array.from(new Set([...tagList, "parcelado"])),
        });
      }
      dispatch({ type: "ADD_TRANSACTIONS", items });
    } else {
      dispatch({ type: "ADD_TRANSACTIONS", items: [{ ...base, id: uid("tx") }] });
      if (recurrent && type !== "transferencia") {
        dispatch({
          type: "UPSERT_RECURRING",
          item: {
            id: uid("rec"),
            name: base.description,
            amount: base.amount,
            categoryId: base.categoryId,
            accountId,
            cardId: base.cardId,
            dayOfMonth: parseISODate(date).getDate(),
            type: type === "receita" ? "receita" : "despesa",
            active: true,
            icon: selectedCategory?.icon ?? "Repeat",
          },
        });
      }
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar transação" : "Nova transação"} wide>
      {/* Tipo */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={cn(
              "ff-focus flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-medium transition-all",
              type === t.id
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
            )}
          >
            <Icon name={t.icon} className={cn("h-5 w-5", type === t.id ? "" : t.color)} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Valor (R$)">
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Data">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <Input placeholder="Ex.: Supermercado, Salário…" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        {type !== "transferencia" && (
          <>
            <Field label="Categoria">
              <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategory(""); }}>
                <option value="">Selecione…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subcategoria">
              <Select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={!selectedCategory?.subcategories.length}>
                <option value="">—</option>
                {selectedCategory?.subcategories.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        <Field label={type === "transferencia" ? "Conta de origem" : "Conta"}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {state.accounts.filter((a) => !a.archived).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>

        {type === "transferencia" ? (
          <Field label="Conta de destino">
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Selecione…</option>
              {state.accounts.filter((a) => !a.archived && a.id !== accountId).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Forma de pagamento">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {paymentMethod === "credito" && type === "despesa" && (
          <Field label="Cartão de crédito">
            <Select value={cardId} onChange={(e) => setCardId(e.target.value)}>
              <option value="">Selecione…</option>
              {state.cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Tags (separadas por vírgula)">
          <Input placeholder="viagem, trabalho…" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>

        <Field label="Observações" className="sm:col-span-2">
          <Textarea placeholder="Detalhes adicionais…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      {/* Comprovante com OCR */}
      <div className="mt-3">
        <label className="ff-focus flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-xs text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400">
          <Icon name={attachment ? "Paperclip" : "Camera"} className="h-4 w-4" />
          {attachment ? attachment.name : "Anexar comprovante (imagem ou PDF) — a IA extrai os dados"}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
        </label>
        {ocrApplied && attachment?.ocr && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400">
            <Icon name="Sparkles" className="h-3 w-3" />
            OCR aplicado: {attachment.ocr.merchant} · {formatBRL(attachment.ocr.amount ?? 0)} — revise antes de salvar.
          </p>
        )}
      </div>

      {/* Cor personalizada */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Cor:</span>
        {TX_COLORS.map((c) => (
          <button
            key={c || "none"}
            type="button"
            aria-label={c ? `Cor ${c}` : "Sem cor"}
            onClick={() => setColor(c)}
            className={cn(
              "ff-focus h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
              color === c ? "border-slate-900 dark:border-white" : "border-transparent",
              !c && "bg-slate-100 dark:bg-slate-800"
            )}
            style={c ? { backgroundColor: c } : undefined}
          >
            {!c && <Icon name="X" className="mx-auto h-3 w-3 text-slate-400" />}
          </button>
        ))}
      </div>

      {/* Switches */}
      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Pendente / agendada</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ainda não foi paga ou recebida</p>
          </div>
          <Switch checked={pending} onChange={setPending} label="Pendente" />
        </div>
        {!editing && type === "despesa" && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Parcelado</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Divide o valor total em parcelas mensais</p>
            </div>
            <div className="flex items-center gap-2">
              {installed && (
                <Select
                  className="h-8 w-20 text-xs"
                  value={String(nInstallments)}
                  onChange={(e) => setNInstallments(Number(e.target.value))}
                >
                  {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </Select>
              )}
              <Switch checked={installed} onChange={setInstalled} label="Parcelado" />
            </div>
          </div>
        )}
        {!editing && type !== "transferencia" && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Recorrente</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Repete todo mês (cria uma conta recorrente)</p>
            </div>
            <Switch checked={recurrent} onChange={setRecurrent} label="Recorrente" />
          </div>
        )}
      </div>

      {installed && !isNaN(parsedAmount) && parsedAmount > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {nInstallments}x de <strong>{formatBRL(parsedAmount / nInstallments)}</strong> (total {formatBRL(parsedAmount)})
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={!valid}>
          <Icon name="Check" className="h-4 w-4" />
          {editing ? "Salvar alterações" : "Adicionar"}
        </Button>
      </div>
    </Modal>
  );
}
