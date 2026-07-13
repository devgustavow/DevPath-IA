"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createSeedState } from "./seed";
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

const STORAGE_KEY = "financeflow:state:v1";
const SESSION_KEY = "financeflow:session:v1";

// ─── Ações ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "RESET_DEMO" }
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

// ─── Sessão (demo — em produção: Supabase Auth) ──────────────────────────────

export interface Session {
  email: string;
  name: string;
  provider: "email" | "google" | "microsoft" | "apple";
  loggedAt: string;
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
  session: Session | null;
  login: (s: Omit<Session, "loggedAt">) => void;
  logout: () => void;
  newId: (prefix: string) => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, () => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Hidrata do localStorage no cliente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && parsed.version === 1) dispatch({ type: "HYDRATE", state: parsed });
      }
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setSession(JSON.parse(s));
    } catch {
      // estado corrompido → mantém seed
    }
    setHydrated(true);
  }, []);

  // Persiste (backup automático local; em produção: Supabase/PostgreSQL)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota excedida — ignora silenciosamente
    }
  }, [state, hydrated]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      hydrated,
      session,
      login: (s) => {
        const full: Session = { ...s, loggedAt: new Date().toISOString() };
        setSession(full);
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(full));
        } catch {}
      },
      logout: () => {
        setSession(null);
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
