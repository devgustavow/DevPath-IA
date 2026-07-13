# 💸 FinanceFlow — Controle Financeiro Pessoal

> Toda a sua vida financeira em um único lugar: contas, cartões, metas, investimentos, orçamento, relatórios e um assistente com IA — com uma experiência premium inspirada em Stripe, Linear e Notion.

![stack](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs&logoColor=fff) ![stack](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=000) ![stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff) ![stack](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=fff) ![stack](https://img.shields.io/badge/Recharts-2.15-8884d8) ![stack](https://img.shields.io/badge/Framer_Motion-12-e64ee9)

## 🚀 Rodando

```bash
cd financeflow
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
```

Entre com **qualquer e-mail/senha** (ou pelos botões Google/Microsoft/Apple) — o app sobe já populado com **7 meses de dados demo realistas**, persistidos no `localStorage`. Restaure os dados demo a qualquer momento em *Configurações → Restaurar dados demo*.

## ✨ Funcionalidades

| Área | O que faz |
|------|-----------|
| **Dashboard** | Saldo, receitas/despesas/economia do mês, valor investido, score de saúde financeira, entradas x saídas, fluxo de caixa diário, categorias, contas a vencer/vencidas, últimas movimentações, metas e insights — com **widgets reordenáveis e ocultáveis** |
| **Transações** | Receita, despesa, transferência e reembolso; categoria/subcategoria, conta, forma de pagamento, tags, cor, observações, comprovante, **parcelamento automático (2–24x)** e recorrência; filtros por período (hoje/ontem/semana/mês/30 dias/ano), tipo, categoria, conta e forma de pagamento; busca global |
| **OCR de comprovantes** | Anexe imagem/PDF e os campos (valor, data, estabelecimento, categoria) são pré-preenchidos *(simulado no demo; pluga visão computacional em produção)* |
| **Importação de extratos** | **OFX, QIF e CSV** com categorização automática por palavras-chave |
| **Categorias** | Ilimitadas, com ícone, cor, subcategorias e orçamento mensal |
| **Contas** | Múltiplas contas (corrente, carteira, PJ, pagamento…) com banco/agência/número, cor e ícone; saldo calculado por transações |
| **Cartões de crédito** | Limite usado/disponível, fatura aberta por ciclo de fechamento, vencimento, melhor dia de compra, lançamentos do ciclo e **parcelamentos em andamento** (parcela atual, restantes, data final) |
| **Recorrentes** | Contas fixas (Netflix, aluguel, energia…) com **geração automática de lançamentos futuros** e **detecção automática de assinaturas** no histórico |
| **Metas** | Valor, prazo, % atingida, quanto guardar/mês, estimativa de conclusão no seu ritmo e **simulador de objetivos** (6/12/24/36 meses) |
| **Investimentos** | Ações, FIIs, Tesouro, CDB, LCI/LCA, cripto e fundos — patrimônio, rentabilidade, lucro, dividendos e alocação por classe |
| **Orçamento** | Limite mensal por categoria com utilizado/restante/%, marcador do "ponto ideal do mês" e alertas de estouro; **Modo Viagem** com orçamento por moeda |
| **Relatórios** | Fluxo de caixa 12m, receitas/despesas por categoria, evolução patrimonial, comparativos mensal/anual, gastos por cartão/banco/forma de pagamento — exportação **PDF, Excel e CSV** |
| **Calendário** | Grade mensal com entradas/saídas por dia, pendências, vencidas, prazos de meta e pagamento em 1 clique |
| **Assistente IA** | Responde "quanto gastei com alimentação?", "maior gasto", "quanto economizei", "quanto guardar para a meta", "gastos no Nubank", "categorias que cresceram", "como reduzir gastos", "resumo financeiro" — e gera **insights automáticos** (gastos fora do padrão, economia vs mês anterior, assinaturas, projeções) |
| **Inteligência** | **Previsão de saldo** para o fim do mês, **score de saúde financeira** (poupança, orçamento, contas em dia, reserva), alertas inteligentes |
| **Conquistas** | Gamificação: meses seguidos no azul, orçamento respeitado, contas em dia, regra dos 20%, reserva de 6 meses… |
| **Notificações** | Conta vencendo/atrasada, fatura fechando, meta atrasada, saldo baixo, orçamento estourado — configuráveis |
| **Perfil & tema** | Nome, avatar, moeda, idioma, fuso; **dark/light/sistema** sem FOUC; seção **Premium** (Modo Família, integração bancária…) |

## 🏗️ Arquitetura

```
financeflow/
├── app/                    # Next.js App Router
│   ├── (app)/              # área logada (shell com sidebar/topbar/bottom-nav)
│   ├── login/              # autenticação (demo; wiring p/ Supabase Auth)
│   └── page.tsx            # landing page
├── components/             # UI kit próprio (estilo shadcn), charts, shell, form
├── lib/
│   ├── types.ts            # domínio completo
│   ├── seed.ts             # gerador determinístico de dados demo
│   ├── store.tsx           # estado global (reducer + localStorage)
│   ├── finance.ts          # motor de cálculos (saldos, faturas, score, previsão…)
│   ├── ai.ts               # assistente em linguagem natural (motor local)
│   ├── importexport.ts     # OFX/QIF/CSV, OCR, exportações
│   └── chart-colors.ts     # paletas validadas p/ acessibilidade (CVD ≥ 12)
├── prisma/schema.prisma    # schema PostgreSQL/Supabase (alvo de produção)
└── supabase/rls-policies.sql  # RLS por usuário + bucket de comprovantes
```

**Modo demo vs nuvem:** sem variáveis de ambiente o app roda 100% offline (login demo + localStorage). Com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas, ele passa automaticamente a usar **Supabase Auth de verdade** (registro com e-mail/senha, confirmação por e-mail, OAuth Google/Microsoft/Apple) e **sincroniza os dados na nuvem** (tabela `user_states` com RLS — cada usuário só acessa os próprios dados, de qualquer dispositivo).

## 🌐 Hospedagem (Supabase + Vercel) — ~10 minutos

### 1) Supabase (banco + autenticação)

1. Crie um projeto grátis em [supabase.com](https://supabase.com) → **New project**.
2. No painel, abra **SQL Editor** → cole o conteúdo de [`supabase/setup.sql`](supabase/setup.sql) → **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
4. (Opcional) Em **Authentication → Sign In / Up**: desative *Confirm email* para permitir login imediato após o cadastro, e habilite os provedores Google/Azure/Apple se quiser login social.

### 2) Vercel (hospedagem)

1. Acesse [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório `devgustavow/DevPath-IA`.
2. Em **Root Directory**, selecione **`financeflow`** (importante — o app fica numa subpasta).
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = a Project URL do passo 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a anon key do passo 1
4. **Deploy**. Pronto: `https://seu-projeto.vercel.app`.

### 3) Ajuste final no Supabase

Em **Authentication → URL Configuration**, defina **Site URL** como a URL da Vercel (ex.: `https://seu-projeto.vercel.app`) — é para onde apontam os links de confirmação de e-mail e o retorno do OAuth.

> Para testar localmente com o Supabase: copie `.env.example` para `.env.local`, preencha as duas variáveis e rode `npm run dev`.

**Evolução futura:** para migrar do estado JSONB para tabelas normalizadas, o alvo já está pronto em `prisma/schema.prisma` + `supabase/rls-policies.sql`. O assistente pode ser plugado num LLM via rota `/api/assistant` (a UI já é assíncrona).

## 🎨 Design

- Paleta da marca: verde `#22C55E` + azul `#3B82F6` sobre branco/cinza-escuro
- Paletas de **gráficos validadas** (contraste ≥ 3:1 e separação para daltonismo em light e dark)
- Mobile first: bottom navigation + FAB, sidebar em drawer, grids responsivos
- Animações sutis com Framer Motion (entradas, modais, progressos, tabs)
