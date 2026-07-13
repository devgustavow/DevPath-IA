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

**Modo demo vs produção:** o front roda 100% offline (localStorage) para ser avaliado sem chaves. A camada de dados é isolada em `lib/store.tsx` — para produção, troque o reducer por chamadas ao Supabase (schema Prisma e políticas RLS já inclusos), ative o Supabase Auth no lugar do login demo e aponte o assistente para um LLM em uma rota `/api/assistant` (a UI já é assíncrona).

## 🎨 Design

- Paleta da marca: verde `#22C55E` + azul `#3B82F6` sobre branco/cinza-escuro
- Paletas de **gráficos validadas** (contraste ≥ 3:1 e separação para daltonismo em light e dark)
- Mobile first: bottom navigation + FAB, sidebar em drawer, grids responsivos
- Animações sutis com Framer Motion (entradas, modais, progressos, tabs)
