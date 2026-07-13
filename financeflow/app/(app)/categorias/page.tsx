"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/shell";
import { Button, Card, ConfirmDialog, Field, IconCircle, Input, Modal, Progress, Select } from "@/components/ui";
import { categoryBreakdown } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { Category } from "@/lib/types";
import { cn, currentMonth, formatBRL, uid } from "@/lib/utils";

const CATEGORY_ICONS = [
  "Home", "ShoppingCart", "Bus", "Fuel", "UtensilsCrossed", "Gamepad2", "Dumbbell", "HeartPulse",
  "GraduationCap", "TrendingUp", "Banknote", "Laptop", "Gift", "PawPrint", "Plane", "Repeat",
  "Cpu", "Music", "Wifi", "Zap", "Droplets", "Luggage", "Trophy", "CircleEllipsis",
];
const CATEGORY_COLORS = ["#16A34A", "#3B82F6", "#7C3AED", "#E11D48", "#D97706", "#0D9488", "#EA580C", "#DB2777", "#2563EB", "#15803D", "#64748B", "#F43F5E"];

export default function CategoriesPage() {
  const { state, dispatch } = useStore();
  const ym = currentMonth();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("CircleEllipsis");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [type, setType] = useState<Category["type"]>("despesa");
  const [budget, setBudget] = useState("");
  const [subcats, setSubcats] = useState("");

  const spentByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categoryBreakdown(state, ym, "despesa")) map.set(c.category.id, c.total);
    for (const c of categoryBreakdown(state, ym, "receita")) map.set(c.category.id, (map.get(c.category.id) ?? 0) + c.total);
    return map;
  }, [state, ym]);

  function openForm(cat?: Category) {
    setEditing(cat ?? null);
    setName(cat?.name ?? "");
    setIcon(cat?.icon ?? "CircleEllipsis");
    setColor(cat?.color ?? CATEGORY_COLORS[0]);
    setType(cat?.type ?? "despesa");
    setBudget(cat?.budget ? String(cat.budget) : "");
    setSubcats(cat?.subcategories.join(", ") ?? "");
    setOpen(true);
  }

  function save() {
    if (!name.trim()) return;
    dispatch({
      type: "UPSERT_CATEGORY",
      item: {
        id: editing?.id ?? uid("cat"),
        name: name.trim(),
        icon,
        color,
        type,
        budget: budget ? parseFloat(budget.replace(",", ".")) : undefined,
        subcategories: subcats.split(",").map((s) => s.trim()).filter(Boolean),
      },
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Categorias"
        subtitle={`${state.categories.length} categorias — crie quantas quiser`}
        action={
          <Button size="sm" onClick={() => openForm()}>
            <Icon name="Plus" className="h-3.5 w-3.5" /> Nova categoria
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.categories.map((c) => {
          const spent = spentByCat.get(c.id) ?? 0;
          const pct = c.budget ? (spent / c.budget) * 100 : 0;
          return (
            <Card key={c.id} className="ff-card-hover group p-4">
              <div className="flex items-center gap-3">
                <IconCircle icon={c.icon} color={c.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-[11px] capitalize text-slate-400">
                    {c.type === "ambas" ? "Receita e despesa" : c.type}
                    {c.subcategories.length > 0 && ` · ${c.subcategories.length} subcategorias`}
                  </p>
                </div>
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openForm(c)} aria-label="Editar" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="Pencil" className="h-4 w-4" />
                  </button>
                  {c.id !== "cat-outros" && (
                    <button onClick={() => setDeleting(c)} aria-label="Excluir" className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                      <Icon name="Trash2" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {c.budget ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {formatBRL(spent)} de {formatBRL(c.budget)}
                    </span>
                    <span className={cn("font-semibold", pct > 100 ? "text-rose-500" : pct > 80 ? "text-amber-500" : "")}>{pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={pct} color={pct > 100 ? "#E11D48" : pct > 80 ? "#D97706" : c.color} />
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-slate-400">
                  Movimentado este mês: <strong className="tabular-nums">{formatBRL(spent)}</strong> · sem orçamento
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar categoria" : "Nova categoria"}>
        <div className="space-y-3">
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Streaming" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={type} onChange={(e) => setType(e.target.value as Category["type"])}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
                <option value="ambas">Ambas</option>
              </Select>
            </Field>
            <Field label="Orçamento mensal (R$)">
              <Input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Opcional" />
            </Field>
          </div>
          <Field label="Ícone">
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    "ff-focus flex h-9 items-center justify-center rounded-lg border transition-colors",
                    icon === i ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700"
                  )}
                >
                  <Icon name={i} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Cor">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
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
          <Field label="Subcategorias (separadas por vírgula)">
            <Input value={subcats} onChange={(e) => setSubcats(e.target.value)} placeholder="Ex.: Netflix, Spotify, HBO" />
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
        onConfirm={() => deleting && dispatch({ type: "DELETE_CATEGORY", id: deleting.id })}
        title="Excluir categoria"
        message={`As transações de "${deleting?.name}" serão movidas para "Outros". Continuar?`}
      />
    </div>
  );
}
