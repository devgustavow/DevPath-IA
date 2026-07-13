import { budgetStatus, monthExpense, monthIncome, monthSavings, pendingBills, investmentTotals } from "./finance";
import { AppState } from "./types";
import { addMonths, currentMonth, todayISO } from "./utils";

export interface AchievementStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0..1
  detail: string;
}

/** Conquistas calculadas em tempo real a partir dos dados */
export function computeAchievements(state: AppState): AchievementStatus[] {
  const ym = currentMonth();
  const today = todayISO();
  const out: AchievementStatus[] = [];

  // Meses consecutivos com economia positiva
  let streak = 0;
  for (let i = 1; i <= 12; i++) {
    const m = addMonths(ym, -i);
    if (monthIncome(state, m) === 0 && monthExpense(state, m) === 0) break;
    if (monthSavings(state, m) > 0) streak++;
    else break;
  }
  out.push({
    id: "poupador",
    name: "Poupador em série",
    description: "Feche 3 meses seguidos gastando menos do que ganha",
    icon: "PiggyBank",
    unlocked: streak >= 3,
    progress: Math.min(1, streak / 3),
    detail: `${streak} ${streak === 1 ? "mês seguido" : "meses seguidos"} no azul`,
  });

  // Orçamento respeitado no mês passado
  const prevBudgets = budgetStatus(state, addMonths(ym, -1));
  const okBudgets = prevBudgets.filter((b) => b.pct <= 100).length;
  out.push({
    id: "orcamento",
    name: "Mestre do orçamento",
    description: "Termine um mês com todas as categorias dentro do orçamento",
    icon: "Target",
    unlocked: prevBudgets.length > 0 && okBudgets === prevBudgets.length,
    progress: prevBudgets.length > 0 ? okBudgets / prevBudgets.length : 0,
    detail: `${okBudgets}/${prevBudgets.length} categorias dentro do limite no mês passado`,
  });

  // Contas em dia
  const { overdue } = pendingBills(state, today);
  out.push({
    id: "pontual",
    name: "Sempre em dia",
    description: "Nenhuma conta vencida no momento",
    icon: "CalendarCheck",
    unlocked: overdue.length === 0,
    progress: overdue.length === 0 ? 1 : 0,
    detail: overdue.length === 0 ? "Nenhuma pendência!" : `${overdue.length} conta(s) vencida(s)`,
  });

  // Primeira meta 50%+
  const bestGoal = state.goals.reduce((max, g) => Math.max(max, g.targetAmount > 0 ? g.savedAmount / g.targetAmount : 0), 0);
  out.push({
    id: "meta50",
    name: "Metade do caminho",
    description: "Alcance 50% de uma meta financeira",
    icon: "Flag",
    unlocked: bestGoal >= 0.5,
    progress: Math.min(1, bestGoal / 0.5),
    detail: `Melhor meta em ${Math.round(bestGoal * 100)}%`,
  });

  // Investidor
  const inv = investmentTotals(state);
  out.push({
    id: "investidor",
    name: "Investidor",
    description: "Tenha R$ 10.000 ou mais investidos",
    icon: "TrendingUp",
    unlocked: inv.current >= 10000,
    progress: Math.min(1, inv.current / 10000),
    detail: `Patrimônio investido acumulado`,
  });

  // Reserva de 6 meses
  let exp3 = 0;
  for (let i = 1; i <= 3; i++) exp3 += monthExpense(state, addMonths(ym, -i));
  const avgExp = exp3 / 3 || 1;
  const monthsCovered = inv.current / avgExp;
  out.push({
    id: "reserva",
    name: "Colchão de segurança",
    description: "Reserva que cobre 6 meses de despesas",
    icon: "ShieldCheck",
    unlocked: monthsCovered >= 6,
    progress: Math.min(1, monthsCovered / 6),
    detail: `Cobre ${monthsCovered.toFixed(1)} meses de despesas`,
  });

  // Registrador — 50 transações no mês
  const txCount = state.transactions.filter((t) => t.date.startsWith(ym)).length;
  out.push({
    id: "registrador",
    name: "Tudo anotado",
    description: "Registre 50 transações em um único mês",
    icon: "NotebookPen",
    unlocked: txCount >= 50,
    progress: Math.min(1, txCount / 50),
    detail: `${txCount} transações este mês`,
  });

  // Economia de 20%+
  const prevInc = monthIncome(state, addMonths(ym, -1));
  const prevSav = monthSavings(state, addMonths(ym, -1));
  const rate = prevInc > 0 ? prevSav / prevInc : 0;
  out.push({
    id: "vinte",
    name: "Regra dos 20%",
    description: "Poupe 20% ou mais da renda em um mês",
    icon: "Percent",
    unlocked: rate >= 0.2,
    progress: Math.min(1, rate / 0.2),
    detail: `Você poupou ${Math.round(rate * 100)}% no mês passado`,
  });

  return out;
}
