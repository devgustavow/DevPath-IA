import { AppState, Category, CreditCard, Goal, Transaction } from "./types";
import { addMonths, clamp, currentMonth, daysInMonth, monthOf, parseISODate, todayISO } from "./utils";

// ─── Básicos ─────────────────────────────────────────────────────────────────

export function isRealized(t: Transaction): boolean {
  return t.status === "efetivada";
}

/** pendente com data passada conta como vencida */
export function effectiveStatus(t: Transaction, today = todayISO()): Transaction["status"] {
  if (t.status === "pendente" && t.date < today) return "vencida";
  return t.status;
}

export function inMonth(t: Transaction, ym: string): boolean {
  return monthOf(t.date) === ym;
}

/** Efeito da transação no saldo de uma conta (apenas efetivadas, fora do cartão) */
export function accountBalance(state: AppState, accountId: string): number {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  let balance = acc.initialBalance;
  for (const t of state.transactions) {
    if (!isRealized(t)) continue;
    if (t.cardId) continue; // compra no cartão só afeta a fatura
    if (t.type === "transferencia") {
      if (t.accountId === accountId) balance -= t.amount;
      if (t.toAccountId === accountId) balance += t.amount;
    } else if (t.accountId === accountId) {
      if (t.type === "receita" || t.type === "reembolso") balance += t.amount;
      else balance -= t.amount;
    }
  }
  return balance;
}

export function totalBalance(state: AppState): number {
  return state.accounts.filter((a) => !a.archived).reduce((s, a) => s + accountBalance(state, a.id), 0);
}

// ─── Agregados mensais ───────────────────────────────────────────────────────

export function monthIncome(state: AppState, ym: string): number {
  return state.transactions
    .filter((t) => inMonth(t, ym) && isRealized(t) && (t.type === "receita" || t.type === "reembolso"))
    .reduce((s, t) => s + t.amount, 0);
}

export function monthExpense(state: AppState, ym: string): number {
  return state.transactions
    .filter((t) => inMonth(t, ym) && isRealized(t) && t.type === "despesa")
    .reduce((s, t) => s + t.amount, 0);
}

export function monthSavings(state: AppState, ym: string): number {
  return monthIncome(state, ym) - monthExpense(state, ym);
}

export interface MonthPoint {
  ym: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function monthlySeries(state: AppState, months: number, endYm = currentMonth()): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ym = addMonths(endYm, -i);
    const receitas = monthIncome(state, ym);
    const despesas = monthExpense(state, ym);
    out.push({ ym, receitas, despesas, saldo: receitas - despesas });
  }
  return out;
}

export interface CategoryTotal {
  category: Category;
  total: number;
  pct: number;
  count: number;
}

export function categoryBreakdown(
  state: AppState,
  ym: string,
  type: "despesa" | "receita" = "despesa"
): CategoryTotal[] {
  const txs = state.transactions.filter(
    (t) => inMonth(t, ym) && isRealized(t) && (type === "despesa" ? t.type === "despesa" : t.type === "receita" || t.type === "reembolso")
  );
  const sum = txs.reduce((s, t) => s + t.amount, 0);
  const map = new Map<string, { total: number; count: number }>();
  for (const t of txs) {
    const cur = map.get(t.categoryId) ?? { total: 0, count: 0 };
    cur.total += t.amount;
    cur.count += 1;
    map.set(t.categoryId, cur);
  }
  const out: CategoryTotal[] = [];
  for (const [catId, { total, count }] of map) {
    const category = state.categories.find((c) => c.id === catId);
    if (!category) continue;
    out.push({ category, total, count, pct: sum > 0 ? (total / sum) * 100 : 0 });
  }
  return out.sort((a, b) => b.total - a.total);
}

export interface DayFlow {
  day: number;
  date: string;
  entrada: number;
  saida: number;
  acumulado: number;
}

export function dailyCashFlow(state: AppState, ym: string): DayFlow[] {
  const nDays = daysInMonth(ym);
  const out: DayFlow[] = [];
  let acc = 0;
  for (let d = 1; d <= nDays; d++) {
    const date = `${ym}-${String(d).padStart(2, "0")}`;
    let entrada = 0;
    let saida = 0;
    for (const t of state.transactions) {
      if (t.date !== date || !isRealized(t)) continue;
      if (t.type === "receita" || t.type === "reembolso") entrada += t.amount;
      else if (t.type === "despesa") saida += t.amount;
    }
    acc += entrada - saida;
    out.push({ day: d, date, entrada, saida, acumulado: acc });
  }
  return out;
}

// ─── Contas a vencer / vencidas ──────────────────────────────────────────────

export function pendingBills(state: AppState, today = todayISO()) {
  const upcoming: Transaction[] = [];
  const overdue: Transaction[] = [];
  for (const t of state.transactions) {
    if (t.type !== "despesa") continue;
    const st = effectiveStatus(t, today);
    if (st === "pendente") upcoming.push(t);
    else if (st === "vencida") overdue.push(t);
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  overdue.sort((a, b) => a.date.localeCompare(b.date));
  return { upcoming, overdue };
}

// ─── Cartões ─────────────────────────────────────────────────────────────────

export interface CardStats {
  card: CreditCard;
  openInvoice: number;
  futureCommitted: number;
  limitUsed: number;
  limitAvailable: number;
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  transactions: Transaction[];
}

/** ciclo de fatura aberto: (fechamento anterior, próximo fechamento] */
export function cardStats(state: AppState, card: CreditCard, today = todayISO()): CardStats {
  const t = parseISODate(today);
  const day = t.getDate();
  let closeYear = t.getFullYear();
  let closeMonth = t.getMonth();
  if (day > card.closingDay) closeMonth += 1;
  const cycleEndD = new Date(closeYear, closeMonth, card.closingDay);
  const cycleStartD = new Date(closeYear, closeMonth - 1, card.closingDay + 1);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const cycleStart = iso(cycleStartD);
  const cycleEnd = iso(cycleEndD);
  const dueD = new Date(cycleEndD.getFullYear(), cycleEndD.getMonth() + (card.dueDay <= card.closingDay ? 1 : 0), card.dueDay);
  const cardTxs = state.transactions.filter((tx) => tx.cardId === card.id && tx.type === "despesa");
  const inCycle = cardTxs.filter((tx) => tx.date >= cycleStart && tx.date <= cycleEnd);
  const future = cardTxs.filter((tx) => tx.date > cycleEnd);
  const openInvoice = inCycle.reduce((s, tx) => s + tx.amount, 0);
  const futureCommitted = future.reduce((s, tx) => s + tx.amount, 0);
  const limitUsed = openInvoice + futureCommitted;
  return {
    card,
    openInvoice,
    futureCommitted,
    limitUsed,
    limitAvailable: Math.max(0, card.limit - limitUsed),
    cycleStart,
    cycleEnd,
    dueDate: iso(dueD),
    transactions: inCycle.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

// ─── Parcelamentos ───────────────────────────────────────────────────────────

export interface InstallmentPlan {
  groupId: string;
  description: string;
  categoryId: string;
  cardId?: string;
  totalAmount: number;
  monthlyAmount: number;
  total: number;
  paid: number;
  remaining: number;
  endDate: string;
  color?: string;
}

export function installmentPlans(state: AppState, today = todayISO()): InstallmentPlan[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    if (!t.installments) continue;
    const arr = groups.get(t.installments.groupId) ?? [];
    arr.push(t);
    groups.set(t.installments.groupId, arr);
  }
  const out: InstallmentPlan[] = [];
  for (const [groupId, txs] of groups) {
    txs.sort((a, b) => a.date.localeCompare(b.date));
    const first = txs[0];
    const paid = txs.filter((t) => t.date <= today).length;
    out.push({
      groupId,
      description: first.description.replace(/\s*\(\d+\/\d+\)\s*$/, ""),
      categoryId: first.categoryId,
      cardId: first.cardId,
      totalAmount: first.installments!.totalAmount,
      monthlyAmount: first.amount,
      total: first.installments!.total,
      paid,
      remaining: first.installments!.total - paid,
      endDate: txs[txs.length - 1].date,
    });
  }
  return out.sort((a, b) => b.remaining - a.remaining);
}

// ─── Orçamento ───────────────────────────────────────────────────────────────

export interface BudgetStatus {
  category: Category;
  budget: number;
  spent: number;
  remaining: number;
  pct: number;
}

export function budgetStatus(state: AppState, ym = currentMonth()): BudgetStatus[] {
  return state.categories
    .filter((c) => c.budget && c.budget > 0 && c.type !== "receita")
    .map((category) => {
      const spent = state.transactions
        .filter((t) => inMonth(t, ym) && t.type === "despesa" && t.categoryId === category.id && t.status !== "pendente")
        .reduce((s, t) => s + t.amount, 0);
      const budget = category.budget!;
      return { category, budget, spent, remaining: budget - spent, pct: (spent / budget) * 100 };
    })
    .sort((a, b) => b.pct - a.pct);
}

// ─── Metas ───────────────────────────────────────────────────────────────────

export interface GoalStats {
  goal: Goal;
  pct: number;
  remaining: number;
  monthsLeft: number;
  monthlyNeeded: number;
  onTrack: boolean;
}

export function goalStats(goal: Goal, today = todayISO()): GoalStats {
  const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const t = parseISODate(today);
  const d = parseISODate(goal.deadline);
  const monthsLeft = Math.max(0, (d.getFullYear() - t.getFullYear()) * 12 + (d.getMonth() - t.getMonth()));
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  // "no ritmo" se a % concluída >= % do tempo decorrido (aproximação: 24 meses de janela)
  const onTrack = remaining === 0 || monthlyNeeded <= goal.targetAmount / 18;
  return { goal, pct, remaining, monthsLeft, monthlyNeeded, onTrack };
}

// ─── Investimentos ───────────────────────────────────────────────────────────

export function investmentTotals(state: AppState) {
  const invested = state.investments.reduce((s, i) => s + i.invested, 0);
  const current = state.investments.reduce((s, i) => s + i.currentValue, 0);
  const dividends = state.investments.reduce((s, i) => s + i.dividends, 0);
  const profit = current - invested;
  const yieldPct = invested > 0 ? (profit / invested) * 100 : 0;
  return { invested, current, dividends, profit, yieldPct };
}

// ─── Previsão de saldo ───────────────────────────────────────────────────────

export interface Forecast {
  current: number;
  pendingIncome: number;
  pendingExpense: number;
  variableEstimate: number;
  projected: number;
  daysLeft: number;
}

export function forecastEndOfMonth(state: AppState, today = todayISO()): Forecast {
  const ym = monthOf(today);
  const current = totalBalance(state);
  const nDays = daysInMonth(ym);
  const dayNum = parseISODate(today).getDate();
  const daysLeft = nDays - dayNum;

  let pendingIncome = 0;
  let pendingExpense = 0;
  for (const t of state.transactions) {
    if (!inMonth(t, ym) || isRealized(t)) continue;
    if (t.type === "receita" || t.type === "reembolso") pendingIncome += t.amount;
    else if (t.type === "despesa" && !t.cardId) pendingExpense += t.amount;
  }

  // gasto variável médio/dia dos últimos 3 meses (sem contas fixas nem cartão futuro)
  let variableTotal = 0;
  let daysCounted = 0;
  for (let i = 1; i <= 3; i++) {
    const m = addMonths(ym, -i);
    variableTotal += state.transactions
      .filter((t) => inMonth(t, m) && t.type === "despesa" && !t.recurringId && isRealized(t))
      .reduce((s, t) => s + t.amount, 0);
    daysCounted += daysInMonth(m);
  }
  const dailyAvg = daysCounted > 0 ? variableTotal / daysCounted : 0;
  const variableEstimate = dailyAvg * daysLeft;
  return {
    current,
    pendingIncome,
    pendingExpense,
    variableEstimate,
    projected: current + pendingIncome - pendingExpense - variableEstimate,
    daysLeft,
  };
}

// ─── Score de saúde financeira ───────────────────────────────────────────────

export interface HealthScore {
  score: number;
  label: string;
  parts: { name: string; score: number; max: number; hint: string }[];
}

export function healthScore(state: AppState, today = todayISO()): HealthScore {
  const ym = monthOf(today);
  const parts: HealthScore["parts"] = [];

  // 1. Taxa de poupança (até 40 pts) — média dos 3 últimos meses fechados
  let inc = 0;
  let exp = 0;
  for (let i = 1; i <= 3; i++) {
    const m = addMonths(ym, -i);
    inc += monthIncome(state, m);
    exp += monthExpense(state, m);
  }
  const savingsRate = inc > 0 ? (inc - exp) / inc : 0;
  const p1 = clamp(Math.round((savingsRate / 0.3) * 40), 0, 40);
  parts.push({ name: "Taxa de poupança", score: p1, max: 40, hint: `Você poupa ${(savingsRate * 100).toFixed(0)}% da renda (meta: 30%)` });

  // 2. Orçamento respeitado (até 25 pts)
  const budgets = budgetStatus(state, ym);
  const ok = budgets.filter((b) => b.pct <= 100).length;
  const p2 = budgets.length > 0 ? Math.round((ok / budgets.length) * 25) : 15;
  parts.push({ name: "Orçamento", score: p2, max: 25, hint: `${ok} de ${budgets.length} categorias dentro do orçamento` });

  // 3. Contas em dia (até 20 pts)
  const { overdue } = pendingBills(state, today);
  const p3 = clamp(20 - overdue.length * 7, 0, 20);
  parts.push({ name: "Contas em dia", score: p3, max: 20, hint: overdue.length === 0 ? "Nenhuma conta vencida" : `${overdue.length} conta(s) vencida(s)` });

  // 4. Reserva e investimentos (até 15 pts)
  const { current } = investmentTotals(state);
  const avgMonthlyExpense = exp / 3 || 1;
  const monthsCovered = current / avgMonthlyExpense;
  const p4 = clamp(Math.round((monthsCovered / 6) * 15), 0, 15);
  parts.push({ name: "Reserva", score: p4, max: 15, hint: `Investimentos cobrem ${monthsCovered.toFixed(1)} meses de despesas (meta: 6)` });

  const score = p1 + p2 + p3 + p4;
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Boa" : score >= 40 ? "Atenção" : "Crítica";
  return { score, label, parts };
}

// ─── Detecção de assinaturas ─────────────────────────────────────────────────

export interface SubscriptionInfo {
  description: string;
  amount: number;
  categoryId: string;
  months: number;
  lastDate: string;
  cardId?: string;
}

export function detectSubscriptions(state: AppState): SubscriptionInfo[] {
  const map = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    if (t.type !== "despesa") continue;
    const key = t.description.replace(/\s*\(\d+\/\d+\)\s*$/, "").toLowerCase();
    const arr = map.get(key) ?? [];
    arr.push(t);
    map.set(key, arr);
  }
  const out: SubscriptionInfo[] = [];
  for (const txs of map.values()) {
    const months = new Set(txs.map((t) => monthOf(t.date)));
    if (months.size < 3) continue;
    const amounts = txs.map((t) => t.amount);
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const stable = amounts.every((v) => Math.abs(v - avg) / avg < 0.25);
    if (!stable) continue;
    const last = txs.reduce((a, b) => (a.date > b.date ? a : b));
    if (last.installments) continue; // parcelamento não é assinatura
    out.push({
      description: last.description,
      amount: avg,
      categoryId: last.categoryId,
      months: months.size,
      lastDate: last.date,
      cardId: last.cardId,
    });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

// ─── Insights automáticos ────────────────────────────────────────────────────

export interface Insight {
  icon: string;
  tone: "positivo" | "negativo" | "neutro";
  text: string;
}

export function generateInsights(state: AppState, today = todayISO()): Insight[] {
  const ym = monthOf(today);
  const prev = addMonths(ym, -1);
  const out: Insight[] = [];
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  // Variação por categoria (mês atual x anterior, pró-rata pelo dia)
  const dayNum = parseISODate(today).getDate();
  const proRata = dayNum / daysInMonth(ym);
  const cur = categoryBreakdown(state, ym, "despesa");
  const before = categoryBreakdown(state, prev, "despesa");
  const catInsights: (Insight & { weight: number })[] = [];
  for (const c of cur) {
    const b = before.find((x) => x.category.id === c.category.id);
    if (!b || b.total < 80) continue;
    const expected = b.total * proRata;
    const delta = ((c.total - expected) / expected) * 100;
    if (delta > 18 && c.total - expected > 60) {
      catInsights.push({
        icon: c.category.icon,
        tone: "negativo",
        weight: c.total - expected,
        text: `Você gastou ${Math.round(delta)}% a mais em ${c.category.name} do que o esperado para esta altura do mês.`,
      });
    } else if (delta < -25 && expected - c.total > 60) {
      catInsights.push({
        icon: c.category.icon,
        tone: "positivo",
        weight: expected - c.total,
        text: `Gastos com ${c.category.name} estão ${Math.round(-delta)}% abaixo do ritmo do mês passado. Continue assim!`,
      });
    }
  }
  // só as 3 variações mais relevantes em R$, para não virar ruído
  catInsights.sort((a, b) => b.weight - a.weight);
  out.push(...catInsights.slice(0, 3).map(({ weight: _w, ...i }) => i));

  // Economia vs mês anterior
  const savPrev = monthSavings(state, prev);
  const sav2 = monthSavings(state, addMonths(ym, -2));
  if (savPrev - sav2 > 100) {
    out.push({ icon: "PiggyBank", tone: "positivo", text: `Você economizou ${fmt(savPrev - sav2)} a mais no mês passado em relação ao anterior.` });
  } else if (sav2 - savPrev > 100) {
    out.push({ icon: "TrendingDown", tone: "negativo", text: `Sua economia caiu ${fmt(sav2 - savPrev)} no mês passado em relação ao anterior.` });
  }

  // Assinaturas
  const subs = detectSubscriptions(state);
  const subsTotal = subs.filter((s) => s.amount < 300).reduce((s, x) => s + x.amount, 0);
  if (subs.length >= 3) {
    out.push({
      icon: "Repeat",
      tone: "neutro",
      text: `Detectamos ${subs.length} pagamentos recorrentes somando ~${fmt(subsTotal)}/mês. Vale revisar o que ainda faz sentido.`,
    });
  }

  // Orçamentos estourados
  const over = budgetStatus(state, ym).filter((b) => b.pct > 100);
  for (const b of over.slice(0, 2)) {
    out.push({ icon: "AlertTriangle", tone: "negativo", text: `Orçamento de ${b.category.name} estourado: ${fmt(b.spent)} de ${fmt(b.budget)} (${Math.round(b.pct)}%).` });
  }

  // Contas vencidas
  const { overdue } = pendingBills(state, today);
  if (overdue.length > 0) {
    out.push({ icon: "CalendarX", tone: "negativo", text: `${overdue.length} conta(s) vencida(s) somando ${fmt(overdue.reduce((s, t) => s + t.amount, 0))}. Regularize para evitar juros.` });
  }

  // Projeção
  const f = forecastEndOfMonth(state, today);
  out.push({
    icon: "Sparkles",
    tone: f.projected >= f.current ? "positivo" : "neutro",
    text: `Projeção de saldo para o fim do mês: ${fmt(f.projected)} (considerando contas futuras e seu gasto médio diário).`,
  });

  return out.slice(0, 6);
}

// ─── Busca e filtros ─────────────────────────────────────────────────────────

export interface TxFilters {
  text?: string;
  categoryId?: string;
  accountId?: string;
  cardId?: string;
  type?: Transaction["type"] | "todas";
  paymentMethod?: string;
  tag?: string;
  from?: string;
  to?: string;
  min?: number;
  max?: number;
}

export function filterTransactions(state: AppState, f: TxFilters): Transaction[] {
  const text = f.text?.trim().toLowerCase();
  return state.transactions
    .filter((t) => {
      if (f.type && f.type !== "todas" && t.type !== f.type) return false;
      if (f.categoryId && t.categoryId !== f.categoryId) return false;
      if (f.accountId && t.accountId !== f.accountId && t.toAccountId !== f.accountId) return false;
      if (f.cardId && t.cardId !== f.cardId) return false;
      if (f.paymentMethod && t.paymentMethod !== f.paymentMethod) return false;
      if (f.tag && !t.tags.includes(f.tag)) return false;
      if (f.from && t.date < f.from) return false;
      if (f.to && t.date > f.to) return false;
      if (f.min !== undefined && t.amount < f.min) return false;
      if (f.max !== undefined && t.amount > f.max) return false;
      if (text) {
        const cat = state.categories.find((c) => c.id === t.categoryId)?.name.toLowerCase() ?? "";
        const acc = state.accounts.find((a) => a.id === t.accountId)?.name.toLowerCase() ?? "";
        const hay = `${t.description} ${cat} ${acc} ${t.notes ?? ""} ${t.tags.join(" ")} ${t.amount.toFixed(2).replace(".", ",")}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export type PeriodPreset = "hoje" | "ontem" | "semana" | "mes" | "30dias" | "ano" | "tudo";

export function periodRange(preset: PeriodPreset, today = todayISO()): { from?: string; to?: string } {
  const t = parseISODate(today);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  switch (preset) {
    case "hoje":
      return { from: today, to: today };
    case "ontem": {
      const y = new Date(t.getTime() - 86_400_000);
      return { from: iso(y), to: iso(y) };
    }
    case "semana": {
      const dow = (t.getDay() + 6) % 7; // segunda = 0
      const start = new Date(t.getTime() - dow * 86_400_000);
      return { from: iso(start), to: today };
    }
    case "mes":
      return { from: `${monthOf(today)}-01`, to: today };
    case "30dias":
      return { from: iso(new Date(t.getTime() - 29 * 86_400_000)), to: today };
    case "ano":
      return { from: `${t.getFullYear()}-01-01`, to: today };
    default:
      return {};
  }
}
