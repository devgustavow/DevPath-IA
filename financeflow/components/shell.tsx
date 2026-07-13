"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { computeNotifications } from "@/lib/notifications";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";
import { useTheme } from "./theme";
import { TransactionFormModal } from "./transaction-form";
import { Badge } from "./ui";

const NAV_SECTIONS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    title: "Visão geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/transacoes", label: "Transações", icon: "ArrowLeftRight" },
      { href: "/calendario", label: "Calendário", icon: "Calendar" },
      { href: "/relatorios", label: "Relatórios", icon: "BarChart3" },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { href: "/orcamento", label: "Orçamento", icon: "Target" },
      { href: "/metas", label: "Metas", icon: "Flag" },
      { href: "/recorrentes", label: "Recorrentes", icon: "Repeat" },
      { href: "/investimentos", label: "Investimentos", icon: "TrendingUp" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/contas", label: "Contas", icon: "Landmark" },
      { href: "/cartoes", label: "Cartões", icon: "CreditCard" },
      { href: "/categorias", label: "Categorias", icon: "Shapes" },
    ],
  },
  {
    title: "Mais",
    items: [
      { href: "/assistente", label: "Assistente IA", icon: "Bot" },
      { href: "/conquistas", label: "Conquistas", icon: "Trophy" },
      { href: "/configuracoes", label: "Configurações", icon: "Settings" },
    ],
  },
];

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="ff-focus flex items-center gap-2 rounded-lg">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-sm">
        <Icon name="Wallet" className="h-4 w-4 text-white" />
      </div>
      {!compact && (
        <span className="text-base font-bold tracking-tight">
          Finance<span className="text-brand-600 dark:text-brand-400">Flow</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "ff-focus group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                  )}
                >
                  <Icon
                    name={item.icon}
                    className={cn("h-4 w-4 transition-colors", active ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function NotificationsMenu() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useMemo(() => computeNotifications(state), [state]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toneColors = {
    danger: "text-rose-500",
    warning: "text-amber-500",
    info: "text-blue-500",
    success: "text-emerald-500",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="ff-focus relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Icon name="Bell" className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold">Lembretes</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">Tudo em dia! Nenhum alerta no momento. 🎉</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/50"
                  >
                    <Icon name={n.icon} className={cn("mt-0.5 h-4 w-4 shrink-0", toneColors[n.tone])} />
                    <div>
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu() {
  const { state, session, logout } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = session?.name || state.profile.name;
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu do usuário"
        className="ff-focus flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
        style={{ backgroundColor: state.profile.avatarColor }}
      >
        {initials}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{session?.email || state.profile.email}</p>
              {state.profile.premium && (
                <Badge tone="violet" className="mt-1.5">
                  <Icon name="Crown" className="h-3 w-3" /> Premium
                </Badge>
              )}
            </div>
            <div className="p-1.5">
              <Link
                href="/configuracoes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon name="Settings" className="h-4 w-4" /> Configurações
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <Icon name="LogOut" className="h-4 w-4" /> Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MOBILE_NAV = [
  { href: "/dashboard", label: "Início", icon: "LayoutDashboard" },
  { href: "/transacoes", label: "Transações", icon: "ArrowLeftRight" },
  { href: "__new__", label: "", icon: "Plus" },
  { href: "/relatorios", label: "Relatórios", icon: "BarChart3" },
  { href: "__menu__", label: "Menu", icon: "Menu" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useStore();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newTxOpen, setNewTxOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Guarda de autenticação (demo)
  useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Icon name="Loader2" className="h-7 w-7 animate-spin text-brand-500" />
      </div>
    );
  }
  if (!session) return null;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/transacoes?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  }

  return (
    <div className="min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-dark lg:flex">
        <div className="flex h-16 items-center px-6">
          <Logo />
        </div>
        <NavLinks />
      </aside>

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-surface-dark lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Logo />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu"
                  className="ff-focus rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon name="X" className="h-5 w-5" />
                </button>
              </div>
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-surface-dark/80 lg:pl-60">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="ff-focus rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <Icon name="Menu" className="h-5 w-5" />
          </button>

          <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 sm:block">
            <Icon name="Search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição, categoria, valor, tag…"
              className="ff-focus h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:placeholder:text-slate-500"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setNewTxOpen(true)}
              className="ff-focus hidden h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] sm:inline-flex"
            >
              <Icon name="Plus" className="h-4 w-4" />
              Nova transação
            </button>
            <button
              onClick={toggle}
              aria-label={isDark ? "Modo claro" : "Modo escuro"}
              className="ff-focus rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Icon name={isDark ? "Sun" : "Moon"} className="h-5 w-5" />
            </button>
            <NotificationsMenu />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="px-4 pb-24 pt-6 sm:px-6 lg:pl-[264px] lg:pr-8 lg:pb-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-surface-dark/95 lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            if (item.href === "__new__") {
              return (
                <button
                  key="new"
                  onClick={() => setNewTxOpen(true)}
                  aria-label="Nova transação"
                  className="flex items-center justify-center py-2"
                >
                  <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-95">
                    <Icon name="Plus" className="h-6 w-6" />
                  </span>
                </button>
              );
            }
            if (item.href === "__menu__") {
              return (
                <button
                  key="menu"
                  onClick={() => setDrawerOpen(true)}
                  className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-slate-400"
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </button>
              );
            }
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active ? "text-brand-600 dark:text-brand-400" : "text-slate-400"
                )}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <TransactionFormModal open={newTxOpen} onClose={() => setNewTxOpen(false)} />
    </div>
  );
}

/** Cabeçalho padrão das páginas */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
