import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatBRL(value: number, opts?: { compact?: boolean; hideSign?: boolean }): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: opts?.compact && abs >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: opts?.compact && abs >= 100_000 ? 1 : 2,
  }).format(opts?.hideSign ? abs : value);
  return formatted;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

/** yyyy-MM-dd de um Date local */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** yyyy-MM do mês corrente */
export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function monthLabel(ym: string, short = false): string {
  const [y, m] = ym.split("-").map(Number);
  return short ? `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}` : `${MONTH_NAMES[m - 1]} de ${y}`;
}

export function formatDate(iso: string, style: "short" | "long" | "weekday" = "short"): string {
  const d = parseISODate(iso);
  if (style === "short") {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (style === "weekday") {
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  }
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function relativeDays(iso: string): string {
  const today = parseISODate(todayISO());
  const target = parseISODate(iso);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff > 0) return `Em ${diff} dias`;
  return `Há ${Math.abs(diff)} dias`;
}

/** Random determinístico (mulberry32) para dados demo estáveis */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
