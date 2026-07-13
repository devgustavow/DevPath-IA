// ─── Domínio FinanceFlow ─────────────────────────────────────────────────────

export type TransactionType = "receita" | "despesa" | "transferencia" | "reembolso";

export type PaymentMethod =
  | "pix"
  | "dinheiro"
  | "debito"
  | "credito"
  | "boleto"
  | "transferencia";

export type TransactionStatus = "efetivada" | "pendente" | "vencida";

export interface Attachment {
  name: string;
  mimeType: string;
  /** dataURL (base64) — em produção iria para o Supabase Storage */
  dataUrl?: string;
  /** Campos extraídos por OCR do comprovante */
  ocr?: { amount?: number; date?: string; merchant?: string; suggestedCategoryId?: string };
}

export interface InstallmentInfo {
  groupId: string;
  total: number;
  current: number;
  totalAmount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  /** valor sempre positivo; o tipo define o sinal */
  amount: number;
  description: string;
  categoryId: string;
  subcategory?: string;
  accountId: string;
  /** conta destino (apenas transferências) */
  toAccountId?: string;
  /** se paga no cartão de crédito */
  cardId?: string;
  paymentMethod: PaymentMethod;
  /** ISO yyyy-MM-dd */
  date: string;
  notes?: string;
  attachment?: Attachment;
  installments?: InstallmentInfo;
  recurringId?: string;
  tags: string[];
  color?: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  /** nome do ícone (lucide) */
  icon: string;
  color: string;
  type: "receita" | "despesa" | "ambas";
  /** orçamento mensal em R$ */
  budget?: number;
  subcategories: string[];
}

export type AccountKind = "carteira" | "corrente" | "poupanca" | "pagamento" | "dinheiro" | "pj";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  bank?: string;
  agency?: string;
  number?: string;
  color: string;
  icon: string;
  initialBalance: number;
  archived?: boolean;
}

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard";

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  /** melhor dia de compra */
  bestPurchaseDay: number;
  /** dia do fechamento da fatura */
  closingDay: number;
  /** dia do vencimento da fatura */
  dueDay: number;
  brand: CardBrand;
  color: string;
  icon: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId: string;
  cardId?: string;
  dayOfMonth: number;
  type: "receita" | "despesa";
  active: boolean;
  icon: string;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  savedAmount: number;
  /** ISO yyyy-MM-dd */
  deadline: string;
  shared?: boolean;
}

export type InvestmentType =
  | "acoes"
  | "fiis"
  | "tesouro"
  | "cdb"
  | "lci"
  | "lca"
  | "cripto"
  | "fundos";

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  invested: number;
  currentValue: number;
  dividends: number;
  institution: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
}

export interface TripBudget {
  id: string;
  name: string;
  currency: string;
  budget: number;
  spent: number;
  active: boolean;
}

export interface NotificationPrefs {
  contaVencendo: boolean;
  contaAtrasada: boolean;
  faturaFechando: boolean;
  metaAtrasada: boolean;
  saldoBaixo: boolean;
  orcamentoEstourado: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarColor: string;
  currency: "BRL" | "USD" | "EUR";
  language: "pt-BR" | "en-US";
  theme: "dark" | "light" | "system";
  timezone: string;
  notifications: NotificationPrefs;
  premium: boolean;
  twoFactor: boolean;
}

export const DEFAULT_WIDGETS = [
  "saldo",
  "receitas",
  "despesas",
  "economia",
  "investido",
  "score",
  "fluxo",
  "categorias",
  "contas-vencer",
  "movimentacoes",
  "meta",
  "insights",
] as const;

export type WidgetId = (typeof DEFAULT_WIDGETS)[number];

export interface AppState {
  version: number;
  profile: UserProfile;
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringBill[];
  goals: Goal[];
  investments: Investment[];
  trips: TripBudget[];
  /** ordem dos widgets do dashboard (personalizável) */
  widgets: string[];
}
