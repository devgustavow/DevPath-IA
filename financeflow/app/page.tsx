"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/icons";
import { useStore } from "@/lib/store";

const FEATURES = [
  { icon: "LayoutDashboard", title: "Dashboard inteligente", text: "Saldo, receitas, despesas, projeções e score de saúde financeira em tempo real." },
  { icon: "Bot", title: "Assistente com IA", text: "Pergunte \"quanto gastei com alimentação?\" e receba respostas sobre os seus dados." },
  { icon: "CreditCard", title: "Cartões e faturas", text: "Limite usado, fatura aberta, parcelamentos e melhor dia de compra." },
  { icon: "Target", title: "Orçamento por categoria", text: "Defina limites mensais e acompanhe alertas antes de estourar." },
  { icon: "Flag", title: "Metas financeiras", text: "Simule quanto guardar por mês para chegar lá no prazo." },
  { icon: "TrendingUp", title: "Investimentos", text: "Patrimônio, rentabilidade, aportes e dividendos em um só painel." },
  { icon: "Camera", title: "OCR de comprovantes", text: "Foto da nota fiscal vira transação categorizada automaticamente." },
  { icon: "Upload", title: "Importação de extratos", text: "OFX, QIF e CSV: seu histórico bancário importado em segundos." },
  { icon: "Trophy", title: "Gamificação", text: "Conquistas que recompensam bons hábitos financeiros." },
];

export default function LandingPage() {
  const { session, hydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && session) router.replace("/dashboard");
  }, [hydrated, session, router]);

  return (
    <div className="min-h-dvh bg-white dark:bg-page-dark">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
            <Icon name="Wallet" className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Finance<span className="text-brand-600 dark:text-brand-400">Flow</span>
          </span>
        </div>
        <Link
          href="/login"
          className="ff-focus rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-14 text-center sm:pt-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            Com assistente financeiro de IA
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Toda a sua vida financeira{" "}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              em um único lugar
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            Contas, cartões, metas, investimentos, orçamento e relatórios — com insights automáticos,
            previsão de saldo e uma experiência premium desde o primeiro acesso.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="ff-focus inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-7 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              Começar agora — é grátis
              <Icon name="ChevronRight" className="h-4 w-4" />
            </Link>
            <span className="text-xs text-slate-400">Sem cartão de crédito · Dados demo inclusos</span>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="ff-card ff-card-hover p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 dark:border-slate-800">
        FinanceFlow © {new Date().getFullYear()} — Controle financeiro pessoal moderno.
      </footer>
    </div>
  );
}
