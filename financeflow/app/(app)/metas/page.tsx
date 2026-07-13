"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, Progress, Select } from "@/components/ui";
import { goalStats, monthSavings } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Goal } from "@/lib/types";
import { addMonths, cn, currentMonth, formatBRL, formatDate, uid } from "@/lib/utils";

const GOAL_ICONS = ["Plane", "Home", "Laptop", "ShieldCheck", "Gift", "GraduationCap", "Luggage", "Trophy", "PiggyBank", "Cpu"];
const GOAL_COLORS = ["#3B82F6", "#16A34A", "#7C3AED", "#E11D48", "#D97706", "#0D9488", "#DB2777"];

export default function GoalsPage() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositValue, setDepositValue] = useState("");

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [color, setColor] = useState(GOAL_COLORS[0]);

  // Simulador
  const [simValue, setSimValue] = useState("20000");
  const [simMonths, setSimMonths] = useState("12");

  const avgSavings = useMemo(() => {
    const ym = currentMonth();
    let sum = 0;
    for (let i = 1; i <= 3; i++) sum += monthSavings(state, addMonths(ym, -i));
    return sum / 3;
  }, [state]);

  function openForm(g?: Goal) {
    setEditing(g ?? null);
    setName(g?.name ?? "");
    setTarget(g ? String(g.targetAmount) : "");
    setSaved(g ? String(g.savedAmount) : "0");
    setDeadline(g?.deadline ?? addMonths(currentMonth(), 12) + "-01");
    setIcon(g?.icon ?? GOAL_ICONS[0]);
    setColor(g?.color ?? GOAL_COLORS[0]);
    setOpen(true);
  }

  function save() {
    const t = parseFloat(target.replace(/\./g, "").replace(",", "."));
    if (!name.trim() || isNaN(t) || t <= 0 || !deadline) return;
    dispatch({
      type: "UPSERT_GOAL",
      item: {
        id: editing?.id ?? uid("goal"),
        name: name.trim(),
        targetAmount: t,
        savedAmount: parseFloat(saved.replace(/\./g, "").replace(",", ".")) || 0,
        deadline,
        icon,
        color,
      },
    });
    setOpen(false);
  }

  const simV = parseFloat(simValue.replace(/\./g, "").replace(",", ".")) || 0;
  const simM = Math.max(1, parseInt(simMonths) || 1);

  return (
    <div>
      <PageHeader
        title="Metas financeiras"
        subtitle="Defina objetivos e acompanhe o progresso"
        action={
          <Button size="sm" onClick={() => openForm()}>
            <Icon name="Plus" className="h-3.5 w-3.5" /> Nova meta
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {state.goals.length === 0 ? (
            <Card>
              <EmptyState icon="Flag" title="Nenhuma meta ainda" description="Crie metas como viagem, carro, reserva de emergência…" action={<Button size="sm" onClick={() => openForm()}>Criar meta</Button>} />
            </Card>
          ) : (
            state.goals.map((g) => {
              const s = goalStats(g);
              const etaMonths = avgSavings > 100 ? Math.ceil(s.remaining / avgSavings) : null;
              return (
                <Card key={g.id} className="ff-card-hover group">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: g.color }}>
                      <Icon name={g.icon} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{g.name}</h3>
                        {s.pct >= 100 ? (
                          <Badge tone="green"><Icon name="Trophy" className="h-3 w-3" /> Concluída!</Badge>
                        ) : s.onTrack ? (
                          <Badge tone="blue">No ritmo</Badge>
                        ) : (
                          <Badge tone="amber">Precisa acelerar</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Prazo: {formatDate(g.deadline)} · {s.monthsLeft} meses restantes
                      </p>
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-lg font-bold tabular-nums">{formatBRL(g.savedAmount)}</span>
                          <span className="text-xs tabular-nums text-slate-400">de {formatBRL(g.targetAmount)} · <strong className="text-slate-600 dark:text-slate-300">{s.pct.toFixed(0)}%</strong></span>
                        </div>
                        <Progress value={s.pct} color={g.color} className="h-2.5" />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60">
                          Falta: <strong className="tabular-nums">{formatBRL(s.remaining)}</strong>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60">
                          Guardar: <strong className="tabular-nums">{formatBRL(s.monthlyNeeded)}/mês</strong>
                        </div>
                        <div className="col-span-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60 sm:col-span-1">
                          {etaMonths !== null && s.remaining > 0
                            ? <>No seu ritmo: <strong>~{etaMonths} meses</strong></>
                            : s.remaining === 0
                              ? "Objetivo alcançado 🎉"
                              : "Ritmo atual insuficiente"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="secondary" onClick={() => { setDepositGoal(g); setDepositValue(""); }}>
                        <Icon name="PiggyBank" className="h-3.5 w-3.5" /> Depositar
                      </Button>
                      <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openForm(g)} aria-label="Editar" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Icon name="Pencil" className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(g)} aria-label="Excluir" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                          <Icon name="Trash2" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Simulador de objetivos */}
        <Card className="h-fit">
          <CardHeader
            title={
              <span className="flex items-center gap-1.5">
                <Icon name="Sparkles" className="h-4 w-4 text-brand-500" /> Simulador de objetivos
              </span>
            }
            subtitle="Quanto guardar por mês para chegar lá?"
          />
          <div className="space-y-3">
            <Field label="Valor do objetivo (R$)">
              <Input inputMode="decimal" value={simValue} onChange={(e) => setSimValue(e.target.value)} />
            </Field>
            <Field label="Prazo (meses)">
              <Input type="number" min={1} value={simMonths} onChange={(e) => setSimMonths(e.target.value)} />
            </Field>
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 p-4 dark:from-brand-500/10 dark:to-accent-500/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">Você precisa guardar</p>
              <p className="text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-400">
                {formatBRL(simV / simM)}/mês
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Sua economia média é {formatBRL(avgSavings)}/mês —{" "}
                {avgSavings >= simV / simM
                  ? "dá para alcançar mantendo o ritmo atual! ✅"
                  : `faltam ${formatBRL(simV / simM - avgSavings)}/mês no seu ritmo atual.`}
              </p>
            </div>
            <div className="space-y-1.5">
              {[6, 12, 24, 36].map((m) => (
                <div key={m} className={cn("flex items-center justify-between rounded-xl px-3 py-2 text-xs", m === simM ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" : "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300")}>
                  <span>Em {m} meses</span>
                  <span className="tabular-nums">{formatBRL(simV / m)}/mês</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Depósito */}
      <Modal open={!!depositGoal} onClose={() => setDepositGoal(null)} title={`Depositar em "${depositGoal?.name}"`}>
        <Field label="Valor (R$)">
          <Input inputMode="decimal" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} placeholder="0,00" autoFocus />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDepositGoal(null)}>Cancelar</Button>
          <Button
            onClick={() => {
              const v = parseFloat(depositValue.replace(/\./g, "").replace(",", "."));
              if (depositGoal && !isNaN(v) && v !== 0) {
                dispatch({ type: "GOAL_DEPOSIT", id: depositGoal.id, amount: v });
              }
              setDepositGoal(null);
            }}
          >
            <Icon name="Check" className="h-4 w-4" /> Confirmar
          </Button>
        </div>
      </Modal>

      {/* Form */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar meta" : "Nova meta"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Viagem para o Japão" />
          </Field>
          <Field label="Valor da meta (R$)">
            <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Já economizado (R$)">
            <Input inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Prazo" className="col-span-2">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Ícone" className="col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {GOAL_ICONS.map((i) => (
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
          <Field label="Cor" className="col-span-2">
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((c) => (
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
          <Button onClick={save}>
            <Icon name="Check" className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: "DELETE_GOAL", id: deleting.id })}
        title="Excluir meta"
        message={`Tem certeza que deseja excluir a meta "${deleting?.name}"?`}
      />
    </div>
  );
}
