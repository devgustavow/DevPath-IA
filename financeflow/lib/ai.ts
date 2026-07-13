import {
  budgetStatus,
  categoryBreakdown,
  cardStats,
  detectSubscriptions,
  filterTransactions,
  forecastEndOfMonth,
  goalStats,
  healthScore,
  monthExpense,
  monthIncome,
  monthSavings,
  pendingBills,
  totalBalance,
  accountBalance,
  investmentTotals,
} from "./finance";
import { AppState } from "./types";
import { addMonths, currentMonth, formatBRL, monthLabel, todayISO } from "./utils";

/**
 * Assistente financeiro: motor de linguagem natural local (determinístico)
 * que responde sobre os dados reais do usuário. A arquitetura permite trocar
 * este motor por um LLM (rota /api/assistant) sem mudar a UI.
 */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function resolveMonth(q: string): { ym: string; label: string } {
  const ym = currentMonth();
  if (/mes passado|ultimo mes|mes anterior/.test(q)) {
    const m = addMonths(ym, -1);
    return { ym: m, label: monthLabel(m) };
  }
  return { ym, label: "este mês" };
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  "cat-restaurante": ["alimentacao", "comida", "restaurante", "ifood", "delivery"],
  "cat-mercado": ["mercado", "supermercado", "compras de casa"],
  "cat-transporte": ["transporte", "uber", "99"],
  "cat-combustivel": ["combustivel", "gasolina", "posto"],
  "cat-moradia": ["moradia", "casa", "aluguel", "energia", "agua", "luz", "internet"],
  "cat-lazer": ["lazer", "diversao", "cinema", "bar"],
  "cat-saude": ["saude", "farmacia", "medico", "plano"],
  "cat-assinaturas": ["assinatura", "assinaturas", "streaming", "netflix", "spotify"],
  "cat-academia": ["academia", "treino"],
  "cat-educacao": ["educacao", "curso", "estudo"],
  "cat-pets": ["pet", "pets", "cachorro", "gato"],
  "cat-viagem": ["viagem", "viagens"],
  "cat-tecnologia": ["tecnologia", "eletronicos", "notebook", "celular"],
  "cat-investimentos": ["investimento", "investimentos", "aporte"],
};

export function answerQuestion(state: AppState, question: string): string {
  const q = normalize(question);
  const today = todayISO();
  const { ym, label } = resolveMonth(q);
  const fmt = (v: number) => formatBRL(v);

  // ── Resumo financeiro ──
  if (/resumo|visao geral|panorama|como estao minhas financas|como esta minha vida financeira/.test(q)) {
    const inc = monthIncome(state, ym);
    const exp = monthExpense(state, ym);
    const sav = inc - exp;
    const hs = healthScore(state, today);
    const f = forecastEndOfMonth(state, today);
    const top = categoryBreakdown(state, ym, "despesa").slice(0, 3);
    const { overdue, upcoming } = pendingBills(state, today);
    return [
      `**Resumo financeiro — ${monthLabel(ym)}**`,
      ``,
      `• Saldo total em contas: **${fmt(totalBalance(state))}**`,
      `• Receitas: **${fmt(inc)}** · Despesas: **${fmt(exp)}** · Economia: **${fmt(sav)}** (${inc > 0 ? Math.round((sav / inc) * 100) : 0}% da renda)`,
      `• Maiores gastos: ${top.map((t) => `${t.category.name} (${fmt(t.total)})`).join(", ") || "—"}`,
      `• Contas: ${overdue.length} vencida(s) e ${upcoming.length} a vencer`,
      `• Projeção de saldo para o fim do mês: **${fmt(f.projected)}**`,
      `• Saúde financeira: **${hs.score}/100 (${hs.label})**`,
    ].join("\n");
  }

  // ── Score / saúde financeira ──
  if (/score|saude financeira|pontuacao/.test(q)) {
    const hs = healthScore(state, today);
    return [
      `Seu score de saúde financeira é **${hs.score}/100 (${hs.label})**.`,
      ``,
      ...hs.parts.map((p) => `• ${p.name}: **${p.score}/${p.max}** — ${p.hint}`),
    ].join("\n");
  }

  // ── Quanto preciso guardar para a meta ──
  if (/(guardar|poupar|economizar).*(meta|objetivo)|meta.*(guardar|poupar|atingir)|quanto falta.*meta/.test(q)) {
    if (state.goals.length === 0) return "Você ainda não tem metas cadastradas. Crie uma na aba **Metas**!";
    const named = state.goals.find((g) => q.includes(normalize(g.name).split(" ")[0]));
    const goals = named ? [named] : state.goals;
    return goals
      .map((g) => {
        const s = goalStats(g, today);
        return `**${g.name}**: faltam ${fmt(s.remaining)} (${s.pct.toFixed(0)}% concluída). Para atingir até ${g.deadline.split("-").reverse().join("/")}, guarde **${fmt(s.monthlyNeeded)}/mês** pelos próximos ${s.monthsLeft} meses.`;
      })
      .join("\n\n");
  }

  // ── Quanto economizei ──
  if (/quanto (eu )?economizei|minha economia|sobrou/.test(q)) {
    const sav = monthSavings(state, ym);
    const prev = monthSavings(state, addMonths(ym, -1));
    const diff = sav - prev;
    const cmp =
      diff >= 0
        ? `**${fmt(diff)} a mais** que no mês anterior`
        : `**${fmt(-diff)} a menos** que no mês anterior`;
    return `Você economizou **${fmt(sav)}** ${label} (receitas − despesas). Isso é ${cmp}.`;
  }

  // ── Maior gasto / maior receita ──
  if (/maior gasto|gasto mais alto|despesa mais cara/.test(q)) {
    const txs = filterTransactions(state, { type: "despesa", from: `${ym}-01`, to: `${ym}-31` });
    if (txs.length === 0) return `Não encontrei despesas em ${label}.`;
    const max = txs.reduce((a, b) => (a.amount > b.amount ? a : b));
    const cat = state.categories.find((c) => c.id === max.categoryId)?.name ?? "—";
    return `Seu maior gasto ${label} foi **${max.description}** — **${fmt(max.amount)}** (${cat}, ${max.date.split("-").reverse().join("/")}).`;
  }
  if (/maior receita|maior entrada/.test(q)) {
    const txs = filterTransactions(state, { type: "receita", from: `${ym}-01`, to: `${ym}-31` });
    if (txs.length === 0) return `Não encontrei receitas em ${label}.`;
    const max = txs.reduce((a, b) => (a.amount > b.amount ? a : b));
    return `Sua maior receita ${label} foi **${max.description}** — **${fmt(max.amount)}**.`;
  }

  // ── Categorias que mais cresceram ──
  if (/categorias? (que )?(mais )?(cresceram|aumentaram|subiram)/.test(q)) {
    const cur = categoryBreakdown(state, addMonths(currentMonth(), -1), "despesa");
    const prev = categoryBreakdown(state, addMonths(currentMonth(), -2), "despesa");
    const growth = cur
      .map((c) => {
        const b = prev.find((x) => x.category.id === c.category.id);
        if (!b || b.total < 50) return null;
        return { name: c.category.name, delta: ((c.total - b.total) / b.total) * 100, abs: c.total - b.total };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && x.delta > 5)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 4);
    if (growth.length === 0) return "Nenhuma categoria teve crescimento relevante entre os dois últimos meses fechados. 👏";
    return [
      `Categorias que mais cresceram (comparando os dois últimos meses fechados):`,
      ``,
      ...growth.map((g) => `• **${g.name}**: +${g.delta.toFixed(0)}% (${fmt(g.abs)} a mais)`),
    ].join("\n");
  }

  // ── Como reduzir gastos ──
  if (/como (posso )?reduzir|dicas.*(economizar|gastos)|cortar gastos/.test(q)) {
    const subs = detectSubscriptions(state).filter((s) => s.amount < 300);
    const over = budgetStatus(state, ym).filter((b) => b.pct > 90);
    const top = categoryBreakdown(state, addMonths(ym, -1), "despesa").filter((c) => !["cat-moradia", "cat-investimentos", "cat-salario"].includes(c.category.id)).slice(0, 2);
    const tips: string[] = [];
    if (subs.length > 0)
      tips.push(`Revise suas **${subs.length} assinaturas** (~${fmt(subs.reduce((s, x) => s + x.amount, 0))}/mês). Cancelar as que você não usa é a economia mais fácil.`);
    for (const b of over.slice(0, 2))
      tips.push(`O orçamento de **${b.category.name}** está em ${Math.round(b.pct)}%. Tente segurar essa categoria até o fim do mês.`);
    for (const t of top)
      tips.push(`**${t.category.name}** foi um dos seus maiores gastos variáveis no mês passado (${fmt(t.total)}). Reduzir 15% liberaria ~${fmt(t.total * 0.15)}/mês.`);
    tips.push(`Automatize um aporte no dia do salário: quem "paga a si mesmo primeiro" poupa em média 2x mais.`);
    return [`Aqui vão sugestões baseadas nos seus dados:`, ``, ...tips.map((t) => `• ${t}`)].join("\n");
  }

  // ── Previsão / projeção ──
  if (/previsao|projecao|quanto vou ter|saldo no fim do mes/.test(q)) {
    const f = forecastEndOfMonth(state, today);
    return [
      `**Previsão de saldo para o fim do mês: ${fmt(f.projected)}**`,
      ``,
      `• Saldo atual: ${fmt(f.current)}`,
      `• Receitas previstas: +${fmt(f.pendingIncome)}`,
      `• Contas a pagar: −${fmt(f.pendingExpense)}`,
      `• Estimativa de gastos variáveis (${f.daysLeft} dias restantes): −${fmt(f.variableEstimate)}`,
    ].join("\n");
  }

  // ── Fatura dos cartões ──
  if (/fatura|cartao|cartoes/.test(q)) {
    const named = state.cards.find((c) => q.includes(normalize(c.name).split(" ")[0]) || q.includes(normalize(c.bank)));
    const cards = named ? [named] : state.cards;
    return cards
      .map((c) => {
        const s = cardStats(state, c, today);
        return `**${c.name}**: fatura aberta de **${fmt(s.openInvoice)}** (fecha em ${s.cycleEnd.split("-").reverse().join("/")}, vence em ${s.dueDate.split("-").reverse().join("/")}). Limite disponível: ${fmt(s.limitAvailable)} de ${fmt(c.limit)}.`;
      })
      .join("\n\n");
  }

  // ── Investimentos ──
  if (/investimento|patrimonio|rentabilidade|dividendos/.test(q)) {
    const t = investmentTotals(state);
    return `Seu patrimônio investido é **${fmt(t.current)}** (${fmt(t.invested)} aportados). Lucro: **${fmt(t.profit)}** (${t.yieldPct.toFixed(1)}%). Dividendos recebidos: ${fmt(t.dividends)}.`;
  }

  // ── Quanto gastei em/no <conta|cartão|categoria> ──
  if (/quanto (eu )?gastei|gastos? (com|em|no|na)|total gasto/.test(q)) {
    // conta ou cartão
    for (const acc of state.accounts) {
      if (q.includes(normalize(acc.name))) {
        const txs = filterTransactions(state, { type: "despesa", accountId: acc.id, from: `${ym}-01`, to: `${ym}-31` });
        const total = txs.reduce((s, t) => s + t.amount, 0);
        return `Você gastou **${fmt(total)}** na conta **${acc.name}** ${label} (${txs.length} transações).`;
      }
    }
    for (const card of state.cards) {
      const key = normalize(card.name).split(" ")[0];
      if (q.includes(key) || q.includes(normalize(card.bank))) {
        const txs = filterTransactions(state, { type: "despesa", cardId: card.id, from: `${ym}-01`, to: `${ym}-31` });
        const total = txs.reduce((s, t) => s + t.amount, 0);
        return `Você gastou **${fmt(total)}** no cartão **${card.name}** ${label} (${txs.length} compras).`;
      }
    }
    // categoria (incl. aliases tipo "alimentação")
    for (const [catId, aliases] of Object.entries(CATEGORY_ALIASES)) {
      if (aliases.some((a) => q.includes(a))) {
        const cat = state.categories.find((c) => c.id === catId);
        if (!cat) continue;
        const ids = catId === "cat-restaurante" && /alimentacao|comida/.test(q) ? ["cat-restaurante", "cat-mercado"] : [catId];
        let total = 0;
        let count = 0;
        for (const id of ids) {
          const txs = filterTransactions(state, { type: "despesa", categoryId: id, from: `${ym}-01`, to: `${ym}-31` });
          total += txs.reduce((s, t) => s + t.amount, 0);
          count += txs.length;
        }
        const nome = ids.length > 1 ? "Alimentação (Mercado + Restaurante)" : cat.name;
        return `Você gastou **${fmt(total)}** com **${nome}** ${label} (${count} transações).`;
      }
    }
    for (const cat of state.categories) {
      if (q.includes(normalize(cat.name))) {
        const txs = filterTransactions(state, { type: "despesa", categoryId: cat.id, from: `${ym}-01`, to: `${ym}-31` });
        const total = txs.reduce((s, t) => s + t.amount, 0);
        return `Você gastou **${fmt(total)}** com **${cat.name}** ${label} (${txs.length} transações).`;
      }
    }
    const total = monthExpense(state, ym);
    return `No total, você gastou **${fmt(total)}** ${label}. Pergunte por uma categoria específica (ex.: "quanto gastei com mercado?").`;
  }

  // ── Saldo ──
  if (/saldo|quanto (eu )?tenho/.test(q)) {
    const lines = state.accounts
      .filter((a) => !a.archived)
      .map((a) => `• ${a.name}: ${fmt(accountBalance(state, a.id))}`);
    return [`Seu saldo total é **${fmt(totalBalance(state))}**.`, ``, ...lines].join("\n");
  }

  // ── Contas a pagar ──
  if (/contas? (a pagar|a vencer|vencida|atrasada)|boletos?/.test(q)) {
    const { upcoming, overdue } = pendingBills(state, today);
    const lines: string[] = [];
    if (overdue.length > 0) {
      lines.push(`**${overdue.length} conta(s) vencida(s)** somando ${fmt(overdue.reduce((s, t) => s + t.amount, 0))}:`);
      lines.push(...overdue.slice(0, 5).map((t) => `• ${t.description} — ${fmt(t.amount)} (${t.date.split("-").reverse().join("/")})`));
      lines.push("");
    }
    lines.push(`**${upcoming.length} conta(s) a vencer** somando ${fmt(upcoming.reduce((s, t) => s + t.amount, 0))}:`);
    lines.push(...upcoming.slice(0, 6).map((t) => `• ${t.description} — ${fmt(t.amount)} (${t.date.split("-").reverse().join("/")})`));
    return lines.join("\n");
  }

  // ── Assinaturas ──
  if (/assinaturas?|recorrentes?/.test(q)) {
    const subs = detectSubscriptions(state);
    return [
      `Detectei **${subs.length} pagamentos recorrentes**:`,
      ``,
      ...subs.slice(0, 8).map((s) => `• ${s.description} — ~${fmt(s.amount)}/mês (${s.months} meses seguidos)`),
      ``,
      `Total: ~${fmt(subs.filter((s) => s.amount < 500).reduce((x, s) => x + s.amount, 0))}/mês em recorrências.`,
    ].join("\n");
  }

  // ── Fallback ──
  return [
    `Posso analisar seus dados e responder coisas como:`,
    ``,
    `• "Quanto gastei com alimentação este mês?"`,
    `• "Qual foi meu maior gasto?"`,
    `• "Quanto economizei?"`,
    `• "Quanto preciso guardar por mês para atingir minha meta?"`,
    `• "Quanto gastei no Nubank?"`,
    `• "Quais categorias mais cresceram?"`,
    `• "Como reduzir meus gastos?"`,
    `• "Faça um resumo financeiro."`,
  ].join("\n");
}

export const SUGGESTED_QUESTIONS = [
  "Faça um resumo financeiro",
  "Quanto gastei com alimentação este mês?",
  "Qual foi meu maior gasto?",
  "Quanto economizei?",
  "Quanto preciso guardar por mês para minhas metas?",
  "Quanto gastei no Nubank?",
  "Quais categorias mais cresceram?",
  "Como reduzir meus gastos?",
  "Qual a previsão de saldo para o fim do mês?",
  "Quais assinaturas eu pago?",
];
