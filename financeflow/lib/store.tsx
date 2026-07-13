"use client";

import type { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createBlankState, createSeedState } from "./seed";
import { supabase } from "./supabase";
import {
  Account,
  AppState,
  Category,
  CreditCard,
  Goal,
  Investment,
  RecurringBill,
  Transaction,
  TripBudget,
  UserProfile,
} from "./types";
import { uid } from "./utils";

const SESSION_KEY = "financeflow:session:v1";

function storageKey(userId: string | null): string {
  return `financeflow:state:v1:${userId ?? "demo"}`;
}

// ─── Ações ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "RESET_DEMO" }
  | { type: "RESET_BLANK"; profile?: Partial<UserProfile> }
  | { type: "ADD_TRANSACTIONS"; items: Transaction[] }
  | { type: "UPDATE_TRANSACTION"; item: Transaction }
  | { type: "DELETE_TRANSACTION"; id: string }
  | { type: "PAY_TRANSACTION"; id: string }
  | { type: "UPSERT_CATEGORY"; item: Category }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "UPSERT_ACCOUNT"; item: Account }
  | { type: "DELETE_ACCOUNT"; id: string }
  | { type: "UPSERT_CARD"; item: CreditCard }
  | { type: "DELETE_CARD"; id: string }
  | { type: "UPSERT_RECURRING"; item: RecurringBill }
  | { type: "DELETE_RECURRING"; id: string }
  | { type: "UPSERT_GOAL"; item: Goal }
  | { type: "DELETE_GOAL"; id: string }
  | { type: "GOAL_DEPOSIT"; id: string; amount: number }
  | { type: "UPSERT_INVESTMENT"; item: Investment }
  | { type: "DELETE_INVESTMENT"; id: string }
  | { type: "UPSERT_TRIP"; item: TripBudget }
  | { type: "DELETE_TRIP"; id: string }
  | { type: "SET_PROFILE"; profile: Partial<UserProfile> }
  | { type: "SET_WIDGETS"; widgets: string[] };

function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [...arr, item];
  const copy = [...arr];
  copy[i] = item;
  return copy;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "RESET_DEMO":
      return createSeedState();
    case "RESET_BLANK":
      return createBlankState({ ...state.profile, ...action.profile });
    case "ADD_TRANSACTIONS":
      return { ...state, transactions: [...state.transactions, ...action.items] };
    case "UPDATE_TRANSACTION":
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.item.id ? action.item : t)) };
    case "DELETE_TRANSACTION":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "PAY_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...t, status: "efetivada" } : t
        ),
      };
    case "UPSERT_CATEGORY":
      return { ...state, categories: upsert(state.categories, action.item) };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        transactions: state.transactions.map((t) =>
          t.categoryId === action.id ? { ...t, categoryId: "cat-outros" } : t
        ),
      };
    case "UPSERT_ACCOUNT":
      return { ...state, accounts: upsert(state.accounts, action.item) };
    case "DELETE_ACCOUNT":
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.id) };
    case "UPSERT_CARD":
      return { ...state, cards: upsert(state.cards, action.item) };
    case "DELETE_CARD":
      return { ...state, cards: state.cards.filter((c) => c.id !== action.id) };
    case "UPSERT_RECURRING":
      return { ...state, recurring: upsert(state.recurring, action.item) };
    case "DELETE_RECURRING":
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.id) };
    case "UPSERT_GOAL":
      return { ...state, goals: upsert(state.goals, action.item) };
    case "DELETE_GOAL":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "GOAL_DEPOSIT":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, savedAmount: Math.max(0, g.savedAmount + action.amount) } : g
        ),
      };
    case "UPSERT_INVESTMENT":
      return { ...state, investments: upsert(state.investments, action.item) };
    case "DELETE_INVESTMENT":
      return { ...state, investments: state.investments.filter((i) => i.id !== action.id) };
    case "UPSERT_TRIP":
      return { ...state, trips: upsert(state.trips, action.item) };
    case "DELETE_TRIP":
      return { ...state, trips: state.trips.filter((t) => t.id !== action.id) };
    case "SET_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case "SET_WIDGETS":
      return { ...state, widgets: action.widgets };
    default:
      return state;
  }
}

// ─── Sessão ──────────────────────────────────────────────────────────────────

export interface Session {
  email: string;
  name: string;
  provider: "email" | "google" | "microsoft" | "apple" | string;
  loggedAt: string;
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
  session: Session | null;
  /** true quando conectado ao Supabase (auth real + nuvem) */
  cloud: boolean;
  /** login do modo demo — sem efeito quando o Supabase está configurado */
  login: (s: Omit<Session, "loggedAt">) => void;
  logout: () => void;
  newId: (prefix: string) => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function sessionFromUser(user: User): Session {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    user.email?.split("@")[0] ||
    "Você";
  return {
    email: user.email ?? "",
    name,
    provider: user.app_metadata?.provider ?? "email",
    loggedAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

function loadLocal(userId: string | null): AppState | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    return parsed && parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, () => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHydratedFor = useRef<string | null | undefined>(undefined);

  /** Carrega o estado do usuário: nuvem → localStorage → dados demo */
  async function hydrateFor(user: User | null): Promise<void> {
    const id = user?.id ?? null;
    if (lastHydratedFor.current === id) return;
    lastHydratedFor.current = id;

    if (supabase && id) {
      try {
        const { data, error } = await supabase
          .from("user_states")
          .select("state")
          .eq("user_id", id)
          .maybeSingle();
        if (!error && data?.state) {
          dispatch({ type: "HYDRATE", state: data.state as AppState });
          return;
        }
      } catch {
        // sem rede/tabela — cai para o local
      }
      const local = loadLocal(id);
      if (local) {
        dispatch({ type: "HYDRATE", state: local });
        return;
      }
      // Primeiro acesso: começa com os dados demo, com o perfil do usuário
      const seeded = createSeedState();
      if (user) {
        const s = sessionFromUser(user);
        seeded.profile = { ...seeded.profile, name: s.name, email: s.email };
      }
      dispatch({ type: "HYDRATE", state: seeded });
      return;
    }

    // Modo demo
    const local = loadLocal(null);
    dispatch({ type: "HYDRATE", state: local ?? createSeedState() });
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;
        if (cancelled) return;
        setSession(user ? sessionFromUser(user) : null);
        setUserId(user?.id ?? null);
        await hydrateFor(user);
      } else {
        try {
          const s = localStorage.getItem(SESSION_KEY);
          if (s) setSession(JSON.parse(s));
        } catch {}
        await hydrateFor(null);
      }
      if (!cancelled) setHydrated(true);
    }
    init();

    const sub = supabase?.auth.onAuthStateChange((_event, sess) => {
      const user = sess?.user ?? null;
      setSession(user ? sessionFromUser(user) : null);
      setUserId(user?.id ?? null);
      if (user) {
        hydrateFor(user).then(() => setHydrated(true));
      }
    });

    return () => {
      cancelled = true;
      sub?.data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência: localStorage sempre + nuvem (debounce) quando logado no Supabase
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(state));
    } catch {
      // quota excedida — ignora
    }
    const client = supabase;
    if (client && userId) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void client
          .from("user_states")
          .upsert({ user_id: userId, state, updated_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error) console.warn("FinanceFlow: falha ao salvar na nuvem:", error.message);
          });
      }, 1500);
    }
  }, [state, hydrated, userId]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      hydrated,
      session,
      cloud: Boolean(supabase),
      login: (s) => {
        if (supabase) return; // com Supabase, o login acontece em app/login via auth
        const full: Session = { ...s, loggedAt: new Date().toISOString() };
        setSession(full);
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(full));
        } catch {}
      },
      logout: () => {
        if (supabase) {
          lastHydratedFor.current = undefined;
          void supabase.auth.signOut();
        }
        setSession(null);
        setUserId(null);
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {}
      },
      newId: uid,
    }),
    [state, hydrated, session]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}
