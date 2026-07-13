"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Field, Input } from "@/components/ui";
import { useStore, type Session } from "@/lib/store";

const SOCIAL: { id: Session["provider"]; label: string; svg: React.ReactNode }[] = [
  {
    id: "google",
    label: "Google",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    ),
  },
  {
    id: "microsoft",
    label: "Microsoft",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
        <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
        <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
        <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const { session, hydrated, login } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && session) router.replace("/dashboard");
  }, [hydrated, session, router]);

  function doLogin(provider: Session["provider"], userEmail?: string, userName?: string) {
    setLoading(true);
    // Demo: em produção, Supabase Auth (signInWithOAuth / signInWithPassword)
    setTimeout(() => {
      login({
        provider,
        email: userEmail || `voce@${provider}.com`,
        name: userName || "Gustavo Oliveira",
      });
      router.push("/dashboard");
    }, 500);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Informe um e-mail válido.");
    if (password.length < 6) return setError("A senha precisa de pelo menos 6 caracteres.");
    if (mode === "signup" && name.trim().length < 2) return setError("Informe seu nome.");
    doLogin("email", email, mode === "signup" ? name : email.split("@")[0]);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page px-4 py-10 dark:bg-page-dark">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
            <Icon name="Wallet" className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Finance<span className="text-brand-600 dark:text-brand-400">Flow</span>
          </span>
        </Link>

        <div className="ff-card p-6 sm:p-8">
          <h1 className="text-lg font-bold">{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === "login" ? "Entre para acompanhar suas finanças." : "Comece a organizar sua vida financeira."}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {SOCIAL.map((s) => (
              <button
                key={s.id}
                onClick={() => doLogin(s.id)}
                disabled={loading}
                className="ff-focus flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {s.svg}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            ou com e-mail
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Nome">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </Field>
            )}
            <Field label="E-mail">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </Field>
            <Field label="Senha">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Icon name="ShieldCheck" className="h-3.5 w-3.5" />
            Demo local — em produção: Supabase Auth com 2FA e criptografia
          </p>
        </div>
      </motion.div>
    </div>
  );
}
