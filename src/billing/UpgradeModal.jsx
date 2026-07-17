import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import {
  Zap,
  Check,
  Loader2,
  ExternalLink,
  RefreshCw,
  LogIn,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Github,
  FolderTree,
  FileText,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react'

/* ============================================================================
 * Modal de upgrade (Free -> Pro) com checkout da Kiwify.
 * O pagamento acontece no checkout hospedado da Kiwify; a ativação é
 * automática via webhook (o comprador precisa usar o MESMO e-mail da conta).
 * ==========================================================================*/

const PRO_FEATURES = [
  { icon: Sparkles, label: 'Roadmaps ilimitados gerados por IA' },
  { icon: SlidersHorizontal, label: 'Escopo dinâmico (features sugeridas pela IA)' },
  { icon: ShieldCheck, label: 'Validador de Sprint (code review sênior)' },
  { icon: HelpCircle, label: 'Pato de Borracha ilimitado' },
  { icon: FolderTree, label: 'Boilerplate + estrutura de pastas (.zip)' },
  { icon: Github, label: 'Exportar sprints para GitHub Issues' },
  { icon: FileText, label: 'README de portfólio com IA' },
]

export default function UpgradeModal({ onClose, showToast }) {
  const { user, refresh } = useAuth()
  const [config, setConfig] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    api.billingPlans().then(setConfig).catch(() => setConfig({ configured: false }))
  }, [])

  // O checkout pode já ter query string — anexa o e-mail do jeito certo.
  const checkoutHref = (() => {
    if (!config?.checkoutUrl) return null
    const sep = config.checkoutUrl.includes('?') ? '&' : '?'
    return user?.email ? `${config.checkoutUrl}${sep}email=${encodeURIComponent(user.email)}` : config.checkoutUrl
  })()

  // "Já paguei": re-consulta o backend — o webhook da Kiwify já deve ter ativado.
  const verify = async () => {
    setChecking(true)
    const updated = await refresh()
    setChecking(false)
    if (updated?.plan === 'pro') {
      showToast?.('Plano Pro ativado! Bem-vindo(a) ⚡', 'success')
      onClose()
    } else {
      showToast?.('Pagamento ainda não identificado — a ativação leva ~1 min após a compra.', 'info')
    }
  }

  const free = config?.plans?.free
  const isPro = user?.plan === 'pro'

  return (
    <Modal title="upgrade · devpath pro" icon={Zap} onClose={onClose} maxW="max-w-2xl">
      {isPro ? (
        <div className="py-6 text-center">
          <Zap className="mx-auto h-10 w-10 text-amber-400" />
          <h3 className="mt-3 font-mono text-lg font-bold text-slate-100">Você já é Pro ⚡</h3>
          <p className="mt-1 text-sm text-slate-400">Aproveite as features de IA sem limites. Bons commits!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Plano Free */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="font-mono text-sm font-bold text-slate-300">Free</p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-slate-100">R$ 0</p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  {free ? `${free.monthly.roadmapGen} gerações de roadmap/mês` : 'Gerações de roadmap limitadas'}
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  {free ? `${free.monthly.premiumAi} usos de features premium/mês` : 'Poucos usos das features premium'}
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  {free ? `Até ${free.savedRoadmaps} roadmaps salvos` : 'Poucos roadmaps salvos'}
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  Comunidade + ofensiva/defensiva
                </li>
              </ul>
            </div>

            {/* Plano Pro */}
            <div className="relative rounded-xl border border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-transparent p-4 ring-1 ring-emerald-500/20">
              <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950">
                recomendado
              </span>
              <p className="flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-300">
                <Zap className="h-4 w-4" /> Pro
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-slate-100">
                {config?.priceLabel || 'R$ 29/mês'}
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                {PRO_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-start gap-1.5">
                    <f.icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!user ? (
            <button
              onClick={() => window.dispatchEvent(new Event('devpath:auth'))}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
            >
              <LogIn className="h-4 w-4" /> Crie sua conta antes de assinar
            </button>
          ) : config?.configured ? (
            <>
              <a
                href={checkoutHref}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400"
              >
                <Zap className="h-4 w-4" /> Assinar Pro na Kiwify <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] leading-relaxed text-slate-500">
                  ⚠️ Use o <strong className="text-slate-300">mesmo e-mail</strong> ({user.email}) no checkout — a
                  ativação é automática (~1 min).
                </p>
                <button
                  onClick={verify}
                  disabled={checking}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300 transition hover:border-slate-600 disabled:opacity-50"
                >
                  {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  já paguei
                </button>
              </div>
            </>
          ) : (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 font-mono text-xs text-slate-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              Checkout ainda não configurado — defina KIWIFY_CHECKOUT_URL no .env do servidor (veja o README).
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
