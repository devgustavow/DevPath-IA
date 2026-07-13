import { budgetStatus, cardStats, goalStats, pendingBills, totalBalance } from "./finance";
import { AppState } from "./types";
import { formatBRL, parseISODate, todayISO } from "./utils";

export interface AppNotification {
  id: string;
  icon: string;
  tone: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
  href: string;
}

/** Lembretes inteligentes calculados sobre o estado atual */
export function computeNotifications(state: AppState, today = todayISO()): AppNotification[] {
  const out: AppNotification[] = [];
  const prefs = state.profile.notifications;
  const { upcoming, overdue } = pendingBills(state, today);

  if (prefs.contaAtrasada) {
    for (const t of overdue.slice(0, 3)) {
      out.push({
        id: `overdue-${t.id}`,
        icon: "CalendarX",
        tone: "danger",
        title: "Conta atrasada",
        message: `${t.description} (${formatBRL(t.amount)}) venceu em ${t.date.split("-").reverse().join("/")}.`,
        href: "/transacoes",
      });
    }
  }

  if (prefs.contaVencendo) {
    const limit = new Date(parseISODate(today).getTime() + 3 * 86_400_000);
    for (const t of upcoming.filter((t) => parseISODate(t.date) <= limit).slice(0, 3)) {
      out.push({
        id: `due-${t.id}`,
        icon: "Bell",
        tone: "warning",
        title: "Conta a vencer",
        message: `${t.description} (${formatBRL(t.amount)}) vence ${t.date === today ? "hoje" : `em ${t.date.split("-").reverse().join("/")}`}.`,
        href: "/calendario",
      });
    }
  }

  if (prefs.faturaFechando) {
    for (const card of state.cards) {
      const s = cardStats(state, card, today);
      const diff = Math.round((parseISODate(s.cycleEnd).getTime() - parseISODate(today).getTime()) / 86_400_000);
      if (diff >= 0 && diff <= 3) {
        out.push({
          id: `invoice-${card.id}`,
          icon: "CreditCard",
          tone: "info",
          title: "Fatura fechando",
          message: `A fatura do ${card.name} (${formatBRL(s.openInvoice)}) fecha em ${diff === 0 ? "hoje" : `${diff} dia(s)`}.`,
          href: "/cartoes",
        });
      }
    }
  }

  if (prefs.orcamentoEstourado) {
    for (const b of budgetStatus(state).filter((b) => b.pct > 100).slice(0, 2)) {
      out.push({
        id: `budget-${b.category.id}`,
        icon: "AlertTriangle",
        tone: "danger",
        title: "Orçamento estourado",
        message: `${b.category.name}: ${formatBRL(b.spent)} de ${formatBRL(b.budget)} (${Math.round(b.pct)}%).`,
        href: "/orcamento",
      });
    }
  }

  if (prefs.metaAtrasada) {
    for (const g of state.goals) {
      const s = goalStats(g, today);
      if (!s.onTrack && s.remaining > 0) {
        out.push({
          id: `goal-${g.id}`,
          icon: "Flag",
          tone: "warning",
          title: "Meta precisa de atenção",
          message: `${g.name}: guarde ${formatBRL(s.monthlyNeeded)}/mês para concluir no prazo.`,
          href: "/metas",
        });
        break; // uma por vez
      }
    }
  }

  if (prefs.saldoBaixo) {
    const bal = totalBalance(state);
    if (bal < 500) {
      out.push({
        id: "low-balance",
        icon: "AlertTriangle",
        tone: "danger",
        title: "Saldo baixo",
        message: `Seu saldo total é ${formatBRL(bal)}. Atenção aos próximos vencimentos.`,
        href: "/dashboard",
      });
    }
  }

  return out;
}
