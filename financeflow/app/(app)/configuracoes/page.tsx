"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useTheme, type ThemeMode } from "@/components/theme";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, ConfirmDialog, Field, Input, Select, Switch } from "@/components/ui";
import { downloadFile } from "@/lib/importexport";
import { useStore } from "@/lib/store";
import { NotificationPrefs, UserProfile } from "@/lib/types";
import { cn, todayISO } from "@/lib/utils";

const AVATAR_COLORS = ["#22C55E", "#3B82F6", "#8B5CF6", "#E11D48", "#D97706", "#0D9488", "#DB2777"];

const NOTIF_LABELS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "contaVencendo", label: "Conta vencendo", desc: "Avisa até 3 dias antes do vencimento" },
  { key: "contaAtrasada", label: "Conta atrasada", desc: "Alerta quando uma conta vence sem pagamento" },
  { key: "faturaFechando", label: "Fatura fechando", desc: "Lembrete antes do fechamento do cartão" },
  { key: "metaAtrasada", label: "Meta atrasada", desc: "Quando o ritmo não alcança o prazo da meta" },
  { key: "saldoBaixo", label: "Saldo baixo", desc: "Quando o saldo total fica abaixo de R$ 500" },
  { key: "orcamentoEstourado", label: "Orçamento estourado", desc: "Quando uma categoria passa de 100%" },
];

const PREMIUM_FEATURES = [
  { icon: "Home", label: "Modo Família", desc: "Contas compartilhadas com múltiplos usuários" },
  { icon: "Flag", label: "Metas compartilhadas", desc: "Economize junto com quem você ama" },
  { icon: "Download", label: "Exportações ilimitadas", desc: "PDF, Excel e CSV sem limites" },
  { icon: "Bot", label: "IA ilimitada", desc: "Perguntas e insights sem restrição" },
  { icon: "BarChart3", label: "Relatórios avançados", desc: "Análises profundas e projeções" },
  { icon: "Landmark", label: "Integração bancária", desc: "Open Finance: sincronização automática" },
];

export default function SettingsPage() {
  const { state, dispatch, session, cloud } = useStore();
  const { mode, setMode } = useTheme();
  const [resetOpen, setResetOpen] = useState(false);
  const [blankOpen, setBlankOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(state.profile.name);

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function setProfile(patch: Partial<UserProfile>) {
    dispatch({ type: "SET_PROFILE", profile: patch });
    flash();
  }

  function exportBackup() {
    downloadFile(`financeflow-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), "application/json");
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Perfil, preferências, notificações e segurança"
        action={saved ? <Badge tone="green"><Icon name="Check" className="h-3 w-3" /> Salvo</Badge> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Perfil */}
        <Card>
          <CardHeader title="Perfil" subtitle="Como você aparece no FinanceFlow" />
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: state.profile.avatarColor }}
            >
              {state.profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setProfile({ avatarColor: c })}
                  aria-label={`Cor ${c}`}
                  className={cn(
                    "ff-focus h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    state.profile.avatarColor === c ? "border-slate-900 dark:border-white" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && setProfile({ name: name.trim() })} />
            </Field>
            <Field label="E-mail">
              <Input value={session?.email ?? state.profile.email} disabled />
            </Field>
            <Field label="Moeda">
              <Select value={state.profile.currency} onChange={(e) => setProfile({ currency: e.target.value as "BRL" | "USD" | "EUR" })}>
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar (US$)</option>
                <option value="EUR">Euro (€)</option>
              </Select>
            </Field>
            <Field label="Idioma">
              <Select value={state.profile.language} onChange={(e) => setProfile({ language: e.target.value as "pt-BR" | "en-US" })}>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
              </Select>
            </Field>
            <Field label="Fuso horário" className="sm:col-span-2">
              <Select value={state.profile.timezone} onChange={(e) => setProfile({ timezone: e.target.value })}>
                {["America/Sao_Paulo", "America/Manaus", "America/Fortaleza", "America/Rio_Branco", "UTC", "Europe/Lisbon"].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Tema</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "light", label: "Claro", icon: "Sun" },
                { id: "dark", label: "Escuro", icon: "Moon" },
                { id: "system", label: "Sistema", icon: "Settings" },
              ] as { id: ThemeMode; label: string; icon: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setMode(t.id); setProfile({ theme: t.id }); }}
                  className={cn(
                    "ff-focus flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-colors",
                    mode === t.id
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                  )}
                >
                  <Icon name={t.icon} className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader title="Notificações" subtitle="Lembretes inteligentes no sino do topo" />
          <div className="space-y-3">
            {NOTIF_LABELS.map((n) => (
              <div key={n.key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-slate-400">{n.desc}</p>
                </div>
                <Switch
                  checked={state.profile.notifications[n.key]}
                  onChange={(v) => setProfile({ notifications: { ...state.profile.notifications, [n.key]: v } })}
                  label={n.label}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader title="Segurança" subtitle="Proteção da sua conta e dos seus dados" />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Autenticação em dois fatores (2FA)</p>
                <p className="text-xs text-slate-400">Código extra ao entrar em novo dispositivo</p>
              </div>
              <Switch checked={state.profile.twoFactor} onChange={(v) => setProfile({ twoFactor: v })} label="2FA" />
            </div>
            {[
              { icon: "ShieldCheck", title: "Criptografia", desc: "Dados protegidos em repouso e em trânsito (AES-256 + TLS)" },
              {
                icon: "Cloud",
                title: cloud ? "Sincronização na nuvem (Supabase)" : "Backup automático local",
                desc: cloud
                  ? "Seus dados são salvos no Supabase com RLS — acesse de qualquer dispositivo"
                  : "Salvo neste navegador; configure o Supabase para sincronizar na nuvem",
              },
              { icon: "Check", title: "Sessão segura", desc: `Login via ${session?.provider ?? "e-mail"} · ${session ? new Date(session.loggedAt).toLocaleString("pt-BR") : ""}` },
            ].map((s) => (
              <div key={s.title} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                <Icon name={s.icon} className="mt-0.5 h-4 w-4 text-brand-500" />
                <div>
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-[11px] text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={exportBackup}>
                <Icon name="Download" className="h-3.5 w-3.5" /> Exportar backup (JSON)
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                <Icon name="Repeat" className="h-3.5 w-3.5" /> Restaurar dados demo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setBlankOpen(true)}>
                <Icon name="Sparkles" className="h-3.5 w-3.5" /> Começar do zero
              </Button>
            </div>
          </div>
        </Card>

        {/* Premium */}
        <Card className="relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/15 to-brand-500/15 blur-2xl" />
          <CardHeader
            title={
              <span className="flex items-center gap-1.5">
                <Icon name="Crown" className="h-4 w-4 text-violet-500" /> FinanceFlow Premium
              </span>
            }
            subtitle={state.profile.premium ? "Plano ativo — aproveite todos os recursos" : "Desbloqueie o próximo nível"}
            action={
              state.profile.premium ? (
                <Badge tone="violet">Ativo</Badge>
              ) : (
                <Button size="sm" onClick={() => setProfile({ premium: true })}>
                  <Icon name="Sparkles" className="h-3.5 w-3.5" /> Ativar (demo)
                </Button>
              )
            }
          />
          <div className="space-y-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", state.profile.premium ? "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800")}>
                  <Icon name={f.icon} className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-[11px] text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {state.profile.premium && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setProfile({ premium: false })}>
              Cancelar plano (demo)
            </Button>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => dispatch({ type: "RESET_DEMO" })}
        title="Restaurar dados demo"
        message="Isso substitui TODOS os seus dados atuais pelos dados de demonstração. Deseja continuar?"
      />
      <ConfirmDialog
        open={blankOpen}
        onClose={() => setBlankOpen(false)}
        onConfirm={() =>
          dispatch({
            type: "RESET_BLANK",
            profile: { name: session?.name ?? state.profile.name, email: session?.email ?? state.profile.email },
          })
        }
        title="Começar do zero"
        message="Isso apaga TODAS as transações, contas, cartões e metas, mantendo apenas as categorias padrão e uma carteira vazia. Deseja continuar?"
      />
    </div>
  );
}
