import {
  Account,
  AppState,
  Category,
  CreditCard,
  DEFAULT_WIDGETS,
  Goal,
  Investment,
  RecurringBill,
  Transaction,
  TripBudget,
  UserProfile,
} from "./types";
import { seededRandom, toISODate } from "./utils";

// ─── Catálogos ───────────────────────────────────────────────────────────────

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-moradia", name: "Moradia", icon: "Home", color: "#7C3AED", type: "despesa", budget: 2600, subcategories: ["Aluguel", "Condomínio", "Energia", "Água", "Internet", "Manutenção"] },
  { id: "cat-mercado", name: "Mercado", icon: "ShoppingCart", color: "#16A34A", type: "despesa", budget: 900, subcategories: ["Supermercado", "Feira", "Padaria", "Açougue"] },
  { id: "cat-transporte", name: "Transporte", icon: "Bus", color: "#3B82F6", type: "despesa", budget: 250, subcategories: ["Uber/99", "Ônibus", "Metrô", "Estacionamento"] },
  { id: "cat-combustivel", name: "Combustível", icon: "Fuel", color: "#EA580C", type: "despesa", budget: 500, subcategories: ["Gasolina", "Etanol"] },
  { id: "cat-restaurante", name: "Restaurante", icon: "UtensilsCrossed", color: "#E11D48", type: "despesa", budget: 450, subcategories: ["Almoço", "Jantar", "Delivery", "Café"] },
  { id: "cat-lazer", name: "Lazer", icon: "Gamepad2", color: "#DB2777", type: "despesa", budget: 400, subcategories: ["Cinema", "Shows", "Jogos", "Bar"] },
  { id: "cat-academia", name: "Academia", icon: "Dumbbell", color: "#0D9488", type: "despesa", budget: 140, subcategories: ["Mensalidade", "Suplementos"] },
  { id: "cat-saude", name: "Saúde", icon: "HeartPulse", color: "#F43F5E", type: "despesa", budget: 550, subcategories: ["Plano de saúde", "Farmácia", "Consultas", "Exames"] },
  { id: "cat-educacao", name: "Educação", icon: "GraduationCap", color: "#2563EB", type: "despesa", budget: 300, subcategories: ["Cursos", "Livros", "Faculdade"] },
  { id: "cat-investimentos", name: "Investimentos", icon: "TrendingUp", color: "#15803D", type: "despesa", subcategories: ["Aporte", "Previdência"] },
  { id: "cat-salario", name: "Salário", icon: "Banknote", color: "#16A34A", type: "receita", subcategories: ["CLT", "Bônus", "13º"] },
  { id: "cat-freelancer", name: "Freelancer", icon: "Laptop", color: "#3B82F6", type: "receita", subcategories: ["Projetos", "Consultoria"] },
  { id: "cat-presentes", name: "Presentes", icon: "Gift", color: "#DB2777", type: "ambas", budget: 150, subcategories: ["Aniversários", "Datas comemorativas"] },
  { id: "cat-pets", name: "Pets", icon: "PawPrint", color: "#D97706", type: "despesa", budget: 200, subcategories: ["Ração", "Veterinário", "Banho e tosa"] },
  { id: "cat-viagem", name: "Viagem", icon: "Plane", color: "#0D9488", type: "despesa", budget: 400, subcategories: ["Passagens", "Hospedagem", "Passeios"] },
  { id: "cat-assinaturas", name: "Assinaturas", icon: "Repeat", color: "#7C3AED", type: "despesa", budget: 220, subcategories: ["Streaming", "Software", "Música"] },
  { id: "cat-tecnologia", name: "Tecnologia", icon: "Cpu", color: "#2563EB", type: "despesa", budget: 500, subcategories: ["Eletrônicos", "Acessórios", "Apps"] },
  { id: "cat-outros", name: "Outros", icon: "CircleEllipsis", color: "#64748B", type: "ambas", subcategories: [] },
];

export const SEED_ACCOUNTS: Account[] = [
  { id: "acc-nubank", name: "Nubank", kind: "corrente", bank: "Nubank", agency: "0001", number: "5501234-8", color: "#8B5CF6", icon: "Landmark", initialBalance: 4200 },
  { id: "acc-inter", name: "Inter", kind: "corrente", bank: "Banco Inter", agency: "0001", number: "8834521-0", color: "#EA580C", icon: "Landmark", initialBalance: 2500 },
  { id: "acc-picpay", name: "PicPay", kind: "pagamento", bank: "PicPay", color: "#16A34A", icon: "Wallet", initialBalance: 350 },
  { id: "acc-carteira", name: "Carteira", kind: "dinheiro", color: "#64748B", icon: "Banknote", initialBalance: 180 },
  { id: "acc-pj", name: "Conta PJ", kind: "pj", bank: "Banco Inter", agency: "0001", number: "7712009-3", color: "#2563EB", icon: "Briefcase", initialBalance: 1800 },
];

export const SEED_CARDS: CreditCard[] = [
  { id: "card-nubank", name: "Nubank Ultravioleta", bank: "Nubank", limit: 12000, bestPurchaseDay: 1, closingDay: 28, dueDay: 7, brand: "mastercard", color: "#8B5CF6", icon: "CreditCard" },
  { id: "card-inter", name: "Inter Gold", bank: "Banco Inter", limit: 6500, bestPurchaseDay: 16, closingDay: 15, dueDay: 22, brand: "visa", color: "#EA580C", icon: "CreditCard" },
];

export const SEED_RECURRING: RecurringBill[] = [
  { id: "rec-salario", name: "Salário", amount: 8500, categoryId: "cat-salario", accountId: "acc-nubank", dayOfMonth: 5, type: "receita", active: true, icon: "Banknote" },
  { id: "rec-aluguel", name: "Aluguel", amount: 1850, categoryId: "cat-moradia", accountId: "acc-nubank", dayOfMonth: 5, type: "despesa", active: true, icon: "Home" },
  { id: "rec-plano", name: "Plano de Saúde", amount: 428.9, categoryId: "cat-saude", accountId: "acc-nubank", dayOfMonth: 8, type: "despesa", active: true, icon: "HeartPulse" },
  { id: "rec-netflix", name: "Netflix", amount: 55.9, categoryId: "cat-assinaturas", accountId: "acc-nubank", cardId: "card-nubank", dayOfMonth: 10, type: "despesa", active: true, icon: "MonitorPlay" },
  { id: "rec-spotify", name: "Spotify", amount: 21.9, categoryId: "cat-assinaturas", accountId: "acc-nubank", cardId: "card-nubank", dayOfMonth: 12, type: "despesa", active: true, icon: "Music" },
  { id: "rec-internet", name: "Internet Fibra", amount: 119.9, categoryId: "cat-moradia", accountId: "acc-inter", dayOfMonth: 15, type: "despesa", active: true, icon: "Wifi" },
  { id: "rec-agua", name: "Água", amount: 92.4, categoryId: "cat-moradia", accountId: "acc-inter", dayOfMonth: 18, type: "despesa", active: true, icon: "Droplets" },
  { id: "rec-energia", name: "Energia", amount: 187.6, categoryId: "cat-moradia", accountId: "acc-inter", dayOfMonth: 20, type: "despesa", active: true, icon: "Zap" },
  { id: "rec-academia", name: "Academia SmartFit", amount: 129.9, categoryId: "cat-academia", accountId: "acc-nubank", dayOfMonth: 6, type: "despesa", active: true, icon: "Dumbbell" },
  { id: "rec-icloud", name: "iCloud+ 200GB", amount: 14.9, categoryId: "cat-assinaturas", accountId: "acc-nubank", cardId: "card-nubank", dayOfMonth: 22, type: "despesa", active: true, icon: "Cloud" },
];

const SEED_GOALS: Goal[] = [
  { id: "goal-europa", name: "Viagem para a Europa", icon: "Plane", color: "#3B82F6", targetAmount: 25000, savedAmount: 10400, deadline: "" },
  { id: "goal-reserva", name: "Reserva de emergência", icon: "ShieldCheck", color: "#16A34A", targetAmount: 30000, savedAmount: 21800, deadline: "" },
  { id: "goal-notebook", name: "MacBook Pro", icon: "Laptop", color: "#7C3AED", targetAmount: 14000, savedAmount: 4650, deadline: "" },
];

const SEED_INVESTMENTS: Investment[] = [
  { id: "inv-tesouro", name: "Tesouro Selic 2029", type: "tesouro", invested: 15000, currentValue: 16480, dividends: 0, institution: "Tesouro Direto" },
  { id: "inv-cdb", name: "CDB Inter 110% CDI", type: "cdb", invested: 8000, currentValue: 8690, dividends: 0, institution: "Banco Inter" },
  { id: "inv-hglg", name: "HGLG11", type: "fiis", invested: 5200, currentValue: 5510, dividends: 312, institution: "XP Investimentos" },
  { id: "inv-petr", name: "PETR4", type: "acoes", invested: 3600, currentValue: 4120, dividends: 486, institution: "XP Investimentos" },
  { id: "inv-ivvb", name: "IVVB11", type: "fundos", invested: 4000, currentValue: 4760, dividends: 0, institution: "Rico" },
  { id: "inv-btc", name: "Bitcoin", type: "cripto", invested: 2500, currentValue: 3340, dividends: 0, institution: "Binance" },
  { id: "inv-lci", name: "LCI Habitação 95% CDI", type: "lci", invested: 6000, currentValue: 6310, dividends: 0, institution: "Banco Inter" },
];

const SEED_TRIPS: TripBudget[] = [
  { id: "trip-bsas", name: "Buenos Aires — Set/2026", currency: "ARS", budget: 6500, spent: 1240, active: true },
];

const SEED_PROFILE: UserProfile = {
  name: "Gustavo Oliveira",
  email: "gustavo@financeflow.app",
  avatarColor: "#22C55E",
  currency: "BRL",
  language: "pt-BR",
  theme: "system",
  timezone: "America/Sao_Paulo",
  notifications: {
    contaVencendo: true,
    contaAtrasada: true,
    faturaFechando: true,
    metaAtrasada: true,
    saldoBaixo: true,
    orcamentoEstourado: true,
  },
  premium: false,
  twoFactor: false,
};

// ─── Gerador de transações ───────────────────────────────────────────────────

interface Gen {
  rnd: () => number;
  list: Transaction[];
  now: Date;
  seq: number;
}

function money(v: number): number {
  return Math.round(v * 100) / 100;
}

function pick<T>(g: Gen, arr: T[]): T {
  return arr[Math.floor(g.rnd() * arr.length)];
}

function range(g: Gen, min: number, max: number): number {
  return min + g.rnd() * (max - min);
}

function dateIn(g: Gen, year: number, month: number, minDay: number, maxDay: number): Date {
  const day = Math.round(range(g, minDay, maxDay));
  return new Date(year, month, Math.max(1, Math.min(28, day)));
}

function push(
  g: Gen,
  t: Omit<Transaction, "id" | "createdAt" | "status" | "date"> & { status?: Transaction["status"] },
  date: Date
): void {
  const iso = toISODate(date);
  const isFuture = date.getTime() > g.now.getTime();
  g.seq += 1;
  g.list.push({
    ...t,
    id: `tx-seed-${g.seq}`,
    createdAt: iso,
    status: t.status ?? (isFuture ? "pendente" : "efetivada"),
    date: iso,
  });
}

const MERCHANTS = {
  mercado: ["Supermercado Pão de Açúcar", "Carrefour", "Assaí Atacadista", "Hortifruti da Esquina", "Padaria Santa Cecília"],
  restaurante: ["iFood — Sushi Kenzo", "Restaurante Coco Bambu", "Hamburgueria Madero", "iFood — Pizzaria Bráz", "Café Cultura", "Churrascaria Fogo de Chão"],
  transporte: ["Uber", "99 Táxi", "Metrô SP", "EstaPar Estacionamento"],
  combustivel: ["Posto Shell", "Posto Ipiranga", "Posto BR"],
  lazer: ["Cinemark", "Steam", "Bar do Zé", "Show — Tickets For Fun", "Playstation Store"],
  saude: ["Drogasil", "Droga Raia", "Consulta Dr. André", "Laboratório Fleury"],
  pets: ["Petz — Ração Golden", "Veterinária Vet+", "Banho e tosa PetLove"],
  tecnologia: ["Amazon — Acessórios", "Kabum — Periféricos", "Mercado Livre — Cabo USB-C"],
  educacao: ["Udemy — Curso", "Livraria Cultura", "Alura Assinatura"],
  presentes: ["Presente — Aniversário", "Presente — Amigo secreto"],
};

/**
 * Gera o estado inicial demo, com ~7 meses de histórico determinístico
 * relativo à data `now`.
 */
export function createSeedState(now = new Date()): AppState {
  const g: Gen = { rnd: seededRandom(20260713), list: [], now, seq: 0 };
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const today = now.getDate();

  // 6 meses completos + mês atual (parcial) + lançamentos futuros do mês
  for (let back = 6; back >= 0; back--) {
    const ref = new Date(thisYear, thisMonth - back, 1);
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const isCurrent = back === 0;
    const lastDay = isCurrent ? 28 : new Date(y, m + 1, 0).getDate();

    // Recorrentes (contas fixas + salário)
    for (const rec of SEED_RECURRING) {
      const d = new Date(y, m, rec.dayOfMonth);
      // No mês atual, o plano de saúde ficou sem pagar (exemplo de conta vencida)
      const overdue = isCurrent && rec.id === "rec-plano" && rec.dayOfMonth < today;
      push(
        g,
        {
          type: rec.type,
          amount: rec.id === "rec-energia" ? money(rec.amount * range(g, 0.85, 1.25)) : rec.amount,
          description: rec.name,
          categoryId: rec.categoryId,
          accountId: rec.accountId,
          cardId: rec.cardId,
          paymentMethod: rec.cardId ? "credito" : rec.type === "receita" ? "transferencia" : "boleto",
          tags: rec.categoryId === "cat-assinaturas" ? ["assinatura"] : [],
          recurringId: rec.id,
          status: overdue ? "vencida" : undefined,
        },
        d
      );
    }

    // Freelancer: 0–2 projetos/mês
    const freelas = Math.floor(range(g, 0, 2.4));
    for (let i = 0; i < freelas; i++) {
      push(
        g,
        {
          type: "receita",
          amount: money(range(g, 800, 2600)),
          description: pick(g, ["Freela — Landing page", "Freela — API Node.js", "Consultoria — Dashboard BI", "Freela — App mobile"]),
          categoryId: "cat-freelancer",
          accountId: "acc-pj",
          paymentMethod: "pix",
          tags: ["freela"],
        },
        dateIn(g, y, m, 8, lastDay)
      );
    }

    // Mercado: 6–9 compras
    const compras = Math.floor(range(g, 6, 9.5));
    for (let i = 0; i < compras; i++) {
      push(
        g,
        {
          type: "despesa",
          amount: money(range(g, 45, 230)),
          description: pick(g, MERCHANTS.mercado),
          categoryId: "cat-mercado",
          subcategory: "Supermercado",
          accountId: "acc-nubank",
          cardId: g.rnd() > 0.4 ? "card-nubank" : undefined,
          paymentMethod: g.rnd() > 0.4 ? "credito" : "debito",
          tags: [],
        },
        dateIn(g, y, m, 1, lastDay)
      );
    }

    // Restaurantes: 4–8 (com leve tendência de alta nos meses recentes)
    const rests = Math.floor(range(g, 4, 8.5)) + (back <= 1 ? 2 : 0);
    for (let i = 0; i < rests; i++) {
      push(
        g,
        {
          type: "despesa",
          amount: money(range(g, 32, 140)),
          description: pick(g, MERCHANTS.restaurante),
          categoryId: "cat-restaurante",
          subcategory: g.rnd() > 0.5 ? "Delivery" : "Jantar",
          accountId: "acc-nubank",
          cardId: "card-nubank",
          paymentMethod: "credito",
          tags: g.rnd() > 0.7 ? ["ifood"] : [],
        },
        dateIn(g, y, m, 1, lastDay)
      );
    }

    // Combustível: 2–4
    for (let i = 0; i < Math.floor(range(g, 2, 4.5)); i++) {
      push(
        g,
        {
          type: "despesa",
          amount: money(range(g, 120, 230)),
          description: pick(g, MERCHANTS.combustivel),
          categoryId: "cat-combustivel",
          accountId: "acc-inter",
          cardId: "card-inter",
          paymentMethod: "credito",
          tags: ["carro"],
        },
        dateIn(g, y, m, 1, lastDay)
      );
    }

    // Transporte por app: 3–6
    for (let i = 0; i < Math.floor(range(g, 3, 6.5)); i++) {
      push(
        g,
        {
          type: "despesa",
          amount: money(range(g, 11, 42)),
          description: pick(g, MERCHANTS.transporte),
          categoryId: "cat-transporte",
          subcategory: "Uber/99",
          accountId: "acc-picpay",
          paymentMethod: "pix",
          tags: [],
        },
        dateIn(g, y, m, 1, lastDay)
      );
    }

    // Lazer: 2–4
    for (let i = 0; i < Math.floor(range(g, 2, 4.5)); i++) {
      push(
        g,
        {
          type: "despesa",
          amount: money(range(g, 25, 160)),
          description: pick(g, MERCHANTS.lazer),
          categoryId: "cat-lazer",
          accountId: "acc-nubank",
          cardId: g.rnd() > 0.5 ? "card-nubank" : undefined,
          paymentMethod: g.rnd() > 0.5 ? "credito" : "pix",
          tags: [],
        },
        dateIn(g, y, m, 1, lastDay)
      );
    }

    // Saúde / pets / tecnologia / educação / presentes — ocasionais
    if (g.rnd() > 0.35) {
      push(g, { type: "despesa", amount: money(range(g, 40, 180)), description: pick(g, MERCHANTS.saude), categoryId: "cat-saude", subcategory: "Farmácia", accountId: "acc-nubank", paymentMethod: "debito", tags: [] }, dateIn(g, y, m, 1, lastDay));
    }
    if (g.rnd() > 0.4) {
      push(g, { type: "despesa", amount: money(range(g, 60, 190)), description: pick(g, MERCHANTS.pets), categoryId: "cat-pets", accountId: "acc-nubank", cardId: "card-nubank", paymentMethod: "credito", tags: ["thor"] }, dateIn(g, y, m, 1, lastDay));
    }
    if (g.rnd() > 0.55) {
      push(g, { type: "despesa", amount: money(range(g, 35, 320)), description: pick(g, MERCHANTS.tecnologia), categoryId: "cat-tecnologia", accountId: "acc-nubank", cardId: "card-nubank", paymentMethod: "credito", tags: [] }, dateIn(g, y, m, 1, lastDay));
    }
    if (g.rnd() > 0.6) {
      push(g, { type: "despesa", amount: money(range(g, 30, 120)), description: pick(g, MERCHANTS.educacao), categoryId: "cat-educacao", accountId: "acc-nubank", paymentMethod: "pix", tags: ["carreira"] }, dateIn(g, y, m, 1, lastDay));
    }
    if (g.rnd() > 0.7) {
      push(g, { type: "despesa", amount: money(range(g, 50, 200)), description: pick(g, MERCHANTS.presentes), categoryId: "cat-presentes", accountId: "acc-nubank", paymentMethod: "pix", tags: [] }, dateIn(g, y, m, 1, lastDay));
    }

    // Aporte mensal em investimentos
    push(
      g,
      {
        type: "despesa",
        amount: money(range(g, 500, 850)),
        description: "Aporte — Tesouro Selic",
        categoryId: "cat-investimentos",
        subcategory: "Aporte",
        accountId: "acc-nubank",
        paymentMethod: "transferencia",
        tags: ["aporte"],
      },
      dateIn(g, y, m, 5, 10)
    );

    // Transferência mensal para o PicPay
    push(
      g,
      {
        type: "transferencia",
        amount: 200,
        description: "Transferência Nubank → PicPay",
        categoryId: "cat-outros",
        accountId: "acc-nubank",
        toAccountId: "acc-picpay",
        paymentMethod: "pix",
        tags: [],
      },
      dateIn(g, y, m, 6, 9)
    );

    // Reembolso ocasional
    if (g.rnd() > 0.6) {
      push(
        g,
        {
          type: "reembolso",
          amount: money(range(g, 40, 220)),
          description: pick(g, ["Reembolso — Despesa da empresa", "Reembolso — Racha do jantar", "Estorno — Compra cancelada"]),
          categoryId: "cat-outros",
          accountId: "acc-nubank",
          paymentMethod: "pix",
          tags: [],
        },
        dateIn(g, y, m, 10, lastDay)
      );
    }
  }

  // Parcelamentos em andamento
  const nbStart = new Date(thisYear, thisMonth - 4, 12);
  for (let p = 0; p < 10; p++) {
    const d = new Date(nbStart.getFullYear(), nbStart.getMonth() + p, 12);
    push(
      g,
      {
        type: "despesa",
        amount: 419.9,
        description: `Notebook Dell Inspiron (${p + 1}/10)`,
        categoryId: "cat-tecnologia",
        accountId: "acc-nubank",
        cardId: "card-nubank",
        paymentMethod: "credito",
        installments: { groupId: "inst-notebook", total: 10, current: p + 1, totalAmount: 4199 },
        tags: ["parcelado"],
      },
      d
    );
  }
  const sofaStart = new Date(thisYear, thisMonth - 2, 3);
  for (let p = 0; p < 6; p++) {
    const d = new Date(sofaStart.getFullYear(), sofaStart.getMonth() + p, 3);
    push(
      g,
      {
        type: "despesa",
        amount: 316.5,
        description: `Sofá retrátil Mobly (${p + 1}/6)`,
        categoryId: "cat-moradia",
        subcategory: "Manutenção",
        accountId: "acc-inter",
        cardId: "card-inter",
        paymentMethod: "credito",
        installments: { groupId: "inst-sofa", total: 6, current: p + 1, totalAmount: 1899 },
        tags: ["parcelado", "casa"],
      },
      d
    );
  }

  const deadline1 = new Date(thisYear + 1, thisMonth, 1);
  const deadline2 = new Date(thisYear + 2, 0, 1);
  const deadline3 = new Date(thisYear, thisMonth + 5, 1);
  const goals = SEED_GOALS.map((goal, i) => ({
    ...goal,
    deadline: toISODate([deadline1, deadline2, deadline3][i]),
  }));

  g.list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    version: 1,
    profile: SEED_PROFILE,
    accounts: SEED_ACCOUNTS,
    cards: SEED_CARDS,
    categories: SEED_CATEGORIES,
    transactions: g.list,
    recurring: SEED_RECURRING,
    goals,
    investments: SEED_INVESTMENTS,
    trips: SEED_TRIPS,
    widgets: [...DEFAULT_WIDGETS],
  };
}
