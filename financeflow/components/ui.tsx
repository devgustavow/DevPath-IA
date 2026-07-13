"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn, formatBRL } from "@/lib/utils";
import { Icon } from "./icons";

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm disabled:bg-brand-600/50",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-600/50",
    outline:
      "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2",
  };
  return (
    <button
      className={cn(
        "ff-focus inline-flex select-none items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Icon name="Loader2" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("ff-card p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Form primitives ─────────────────────────────────────────────────────────

export function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300", className)} {...props}>
      {children}
    </label>
  );
}

const fieldBase =
  "ff-focus w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />;
  }
);

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-10 cursor-pointer appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[72px] py-2.5", className)} {...props} />;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "blue" | "amber" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function Progress({
  value,
  color,
  className,
  track,
}: {
  value: number; // 0..100
  color?: string;
  className?: string;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", track, className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color ?? "#22C55E" }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Switch ──────────────────────────────────────────────────────────────────

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "ff-focus relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const layoutId = React.useId();
  return (
    <div className={cn("flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "ff-focus relative whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
            value === t.id
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {value === t.id && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-700"
            />
          )}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl",
              wide ? "sm:max-w-2xl" : "sm:max-w-md"
            )}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Excluir
        </Button>
      </div>
    </Modal>
  );
}

// ─── Diversos ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Icon name={icon} className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Valor monetário colorido por sinal */
export function Money({
  value,
  className,
  signed,
  compact,
}: {
  value: number;
  className?: string;
  /** colore verde/vermelho conforme o sinal */
  signed?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        signed && value > 0 && "text-emerald-600 dark:text-emerald-400",
        signed && value < 0 && "text-rose-600 dark:text-rose-400",
        className
      )}
    >
      {signed && value > 0 ? "+" : ""}
      {formatBRL(value, { compact })}
    </span>
  );
}

/** Círculo de ícone colorido (categorias, contas…) */
export function IconCircle({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-xl", sizes[size], className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon name={icon} className={iconSizes[size]} />
    </div>
  );
}

/** Renderiza **negrito** simples nas respostas do assistente */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <p key={i} className={cn("min-h-[0.5rem]", line.startsWith("•") && "pl-1")}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <React.Fragment key={j}>{part}</React.Fragment>
            )
          )}
        </p>
      ))}
    </>
  );
}
