# 🧭 DevPath AI — O Arquiteto de Carreira para Devs

> Pare de assistir. Comece a construir. **O fim do Tutorial Hell** via Engenharia Reversa de Projetos (Project-Based Learning).

DevPath AI recebe um **projeto real** que você quer construir, faz a "engenharia reversa" dele com **IA (Google Gemini)** e devolve um **roadmap prático em sprints semanais** — onde cada tarefa é *construir um módulo de código de verdade*, nunca "estudar teoria".

![stack](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=000) ![stack](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=fff) ![stack](https://img.shields.io/badge/Node-Express-339933?logo=node.js&logoColor=fff) ![stack](https://img.shields.io/badge/Google-Gemini-8E75B2?logo=googlegemini&logoColor=fff) ![stack](https://img.shields.io/badge/Tailwind-CDN-38bdf8?logo=tailwindcss&logoColor=fff)

> 💡 Sem chave de API o app **continua funcionando**: ele cai automaticamente num roadmap de exemplo (mock). Com a `GEMINI_API_KEY` configurada, o roadmap passa a ser gerado sob medida pela IA.

---

## ✨ Funcionalidades

| # | Tela / Recurso | O que faz |
|---|----------------|-----------|
| 1 | **Setup do Dev** | Formulário com projeto desejado, nível, horas/semana e stack (tags). |
| 2 | **Terminal de IA** | Loader estilo terminal rodando comandos sequenciais enquanto o **backend chama o Gemini**. |
| 3 | **Dashboard / Roadmap** | Resumo (semanas, esforço, conclusão prevista, progresso), mapa de dependências e timeline em sprints — um badge indica se veio da **IA** ou do **exemplo**. |
| 🔁 | **Recalcular Rota** | Perdeu uma semana? Um clique empurra todo o cronograma em +1 semana, sem culpa. |
| ✅ | **Commit de tarefas** | Marcar uma tarefa como concluída gera um "commit" no histórico — com hash, mensagem e horário. |
| 🐙 | **Integração GitHub** | Conecta seu perfil **real** via API pública do GitHub (avatar, repos, seguidores) e "sincroniza" seus commits de progresso. |
| 🔐 | **Login & Cadastro** | Autenticação **real**: senha com hash (bcrypt) + sessão via **JWT**. Persiste entre reinícios. |
| 💬 | **Comunidade (estilo Reddit)** | Feed de posts com **upvote/downvote**, ordenação (Quentes/Novos/Top), **comentários** e categorias. |
| 📢 | **Compartilhar roadmap** | Publique o roadmap gerado pela IA como um post e peça feedback da comunidade. |
| 👤 | **Dashboard do Perfil** | "Trabalhando em" (projeto/roadmap ativo), karma, e seus últimos posts/compartilhamentos. |
| 🔥 | **Ofensiva & 🛡️ Defensiva** | Streak de dias consecutivos (ofensiva) + escudos que protegem quando você falha um dia (defensiva). |
| 🔔 | **Notificações** | Avisos quando comentam ou votam no seu post, com badge de não lidas no header. |
| ✅ | **Checklist (DoD)** | A IA também gera um *Definition of Done* por sprint — critérios objetivos de "pronto". |
| 📁 | **Meus roadmaps** | Aba na home para **ver, continuar (com progresso salvo) e excluir** todos os seus roadmaps. |
| 🎚️ | **Escopo dinâmico** | A IA sugere features opcionais (checkboxes); o que você marca entra no roadmap e ajusta as semanas. |
| 🐙 | **Exportar p/ GitHub Issues** | Cria uma **milestone por sprint** e uma **issue por tarefa** (com Definition of Done) no seu repo. |
| 🗂️ | **Boilerplate + árvore de pastas** | Gera um script de terminal e a estrutura inicial — copie, baixe `setup.sh` ou um **`.zip`**. |
| 🛡️ | **Validador de Sprint** | Cole seu código e receba um **code review** técnico da IA (como um sênior no seu PR). |
| 🦆 | **Pato de Borracha** | Travou numa tarefa? A IA te guia com **perguntas socráticas e pistas** — sem entregar a resposta. |
| 📄 | **README de portfólio** | Ao chegar a 100%, gera um **README.md** impecável com o que você construiu, pronto pro GitHub. |

### Dados mockados
O roadmap de exemplo é baseado em um caso real: construir um **SaaS de Gestão de Tarefas com React e Node** — 8 sprints, do setup do monorepo ao deploy com CI/CD.

---

## 🎨 Estética

- **Dark mode** estilo IDE (`bg-slate-950`) com grid de blueprint e glows sutis.
- Destaque em **verde esmeralda** (terminal/matrix) + toques de **azul/roxo** nos componentes interativos.
- Tipografia: **Inter** para leitura, **JetBrains Mono** para títulos, labels e dados técnicos.

---

## 🚀 Como rodar

Pré-requisito: **Node 18+**.

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar a chave do Gemini (opcional, mas recomendado)

Pegue uma chave gratuita em **<https://aistudio.google.com/app/apikey>** e crie o `.env`:

```bash
cp .env.example .env      # Linux/Mac   (Windows: copy .env.example .env)
# edite o .env e cole sua chave em GEMINI_API_KEY=
```

### 3. Subir front + back juntos

```bash
npm run dev:all
```

- Frontend (Vite): <http://localhost:5173>
- Backend (Express): <http://localhost:3001>

O Vite faz **proxy** de `/api` → backend, então é só abrir o endereço do front.

> Quer rodar só o front (modo mock, sem IA)? `npm run dev`.
> Só o backend? `npm run server`.

```bash
# Build de produção do front
npm run build && npm run preview
```

---

## 🤖 Backend & IA (Google Gemini)

O backend é um **Express** mínimo em `server/`:

| Rota | Método | O que faz |
|------|--------|-----------|
| `/api/roadmap` | `POST` | Recebe `{ project, level, hours, stack }` e devolve o roadmap gerado pelo Gemini. |
| `/api/health` | `GET` | Status do serviço (provider, modelo, se há chave). |

- A chamada usa **structured output** (`responseSchema`) → o Gemini responde **JSON válido e previsível** (sprints + dependências), sem precisar "limpar" texto.
- A `GEMINI_API_KEY` fica **só no servidor** — nunca é exposta ao navegador.

### Mais endpoints de IA (`server/features.js`)

| Rota | O que faz |
|------|-----------|
| `POST /api/suggest-features` | Sugere features opcionais (escopo dinâmico). |
| `POST /api/boilerplate` | Script de terminal + árvore de pastas inicial. |
| `POST /api/review-code` | Code review de um sprint (verdict + issues). |
| `POST /api/rubber-duck` | Pistas socráticas para destravar (sem dar a resposta). |
| `POST /api/portfolio-readme` | Gera o `README.md` de portfólio (markdown). |
| `POST /api/export/github-issues` | Cria milestones + issues no GitHub (usa um PAT do usuário, **não salvo**). |

> A exportação para GitHub Issues pede um **Personal Access Token** com escopo `repo` (ou fine-grained com permissão de Issues). Ele é usado só na requisição e nunca é persistido.

---

## 💰 Monetização (Kiwify)

Modelo **freemium**: plano Free com cotas mensais + plano **Pro** por assinatura via [Kiwify](https://kiwify.com.br).

| Plano | Roadmaps salvos | Gerações de roadmap | Features premium* |
|-------|-----------------|---------------------|-------------------|
| **Free** | 2 | 5/mês | 5 usos/mês |
| **Pro** | ilimitado | 100/mês** | 300/mês** |

\* Features premium: escopo dinâmico, boilerplate, validador de sprint, pato de borracha, README de portfólio e export p/ GitHub Issues (exigem login; a cota só é debitada em chamadas bem-sucedidas).
\*\* Teto anti-abuso.

### Como ligar

1. Crie o produto (assinatura) na Kiwify e copie o link do checkout → `KIWIFY_CHECKOUT_URL` no `.env`.
2. Na Kiwify (**Apps → Webhooks**), crie um webhook apontando para `https://SEU-DOMINIO/api/webhooks/kiwify` com os eventos de **compra aprovada, reembolso, chargeback e assinatura cancelada/renovada/atrasada**. Copie o token → `KIWIFY_WEBHOOK_TOKEN` (valida a assinatura HMAC-SHA1 enviada em `?signature=`).
3. (Opcional) `KIWIFY_PRODUCT_ID` filtra eventos de outros produtos; `KIWIFY_PRICE_LABEL` muda o preço exibido no modal.

### Como funciona a ativação

- O usuário paga no checkout da Kiwify usando o **mesmo e-mail** da conta DevPath → o webhook chega → o plano vira **Pro** automaticamente.
- Pagou **antes** de criar a conta? O upgrade fica **pendente** e é aplicado no cadastro.
- Reembolso/chargeback/cancelamento → volta para o Free automaticamente.
- Quando a cota acaba, a API responde `402 { code: "UPGRADE_REQUIRED" }` e o front abre o modal de upgrade sozinho.

> 💻 **Local**: `localhost` não recebe webhook — exponha com um túnel (ex: ngrok) ou simule com `curl` assinando o corpo com HMAC-SHA1 do token.

| Rota | Método | O que faz |
|------|--------|-----------|
| `/api/billing/plans` | `GET` | Config pública: checkout, preço e cotas dos planos. |
| `/api/webhooks/kiwify` | `POST` | Webhook da Kiwify (ativa/cancela o Pro). |
- **Variáveis** (`.env`): `GEMINI_API_KEY`, `GEMINI_MODEL` (padrão `gemini-2.5-flash`), `JWT_SECRET`, `PORT` (padrão `3001`).
  - 💡 Use um modelo com cota no free tier (ex.: `gemini-2.5-flash`). O `gemini-2.0-flash` e a série `1.5` podem retornar `429`/`404` em chaves novas.
- **Sem chave / IA fora do ar?** O front detecta o erro e usa o **roadmap de exemplo** automaticamente, com um aviso. Nada quebra.

> ⚠️ **Nunca** commite seu `.env` — ele já está no `.gitignore`. Use o `.env.example` como modelo.

---

## 🔐 Autenticação & 💬 Comunidade

Login/cadastro **de verdade** e uma área estilo Reddit, com persistência em arquivo JSON (`server/data/db.json`, fora do versionamento).

| Rota | Método | Auth | O que faz |
|------|--------|------|-----------|
| `/api/auth/register` | `POST` | — | Cria conta (hash bcrypt) e devolve um JWT. |
| `/api/auth/login` | `POST` | — | Login por email/usuário + senha → JWT. |
| `/api/auth/me` | `GET` | 🔒 | Dados do usuário logado. |
| `/api/posts` | `GET` | — | Feed (`?sort=hot\|new\|top`). |
| `/api/posts` | `POST` | 🔒 | Cria post (com roadmap opcional anexado). |
| `/api/posts/:id` | `GET` | — | Post + comentários. |
| `/api/posts/:id/comments` | `POST` | 🔒 | Comenta. |
| `/api/posts/:id/vote` | `POST` | 🔒 | Upvote/downvote (`{ value: 1\|-1\|0 }`). |
| `/api/comments/:id/vote` | `POST` | 🔒 | Vota em comentário. |
| `/api/me/dashboard` | `GET` | 🔒 | Perfil: streak, projeto atual, stats e posts. |
| `/api/me/activity` | `POST` | 🔒 | Registra atividade e atualiza a ofensiva/defensiva. |
| `/api/me/roadmaps` | `GET` | 🔒 | Lista os roadmaps salvos do usuário (com progresso). |
| `/api/me/roadmaps` | `POST` | 🔒 | Salva um novo roadmap gerado. |
| `/api/me/roadmaps/:id` | `GET` | 🔒 | Abre um roadmap completo (para continuar). |
| `/api/me/roadmaps/:id` | `PUT` | 🔒 | Atualiza o progresso (tarefas concluídas). |
| `/api/me/roadmaps/:id` | `DELETE` | 🔒 | Exclui um roadmap. |
| `/api/notifications` | `GET` | 🔒 | Lista notificações (+ não lidas). |
| `/api/notifications/read` | `POST` | 🔒 | Marca todas como lidas. |

### 🔥 Progressão (Ofensiva & Defensiva)

Inspirado no Duolingo — **consistência > intensidade**:

- **Ofensiva** = dias consecutivos com atividade (concluir tarefa, gerar roadmap ou postar). Cada dia seguido soma +1.
- **Defensiva** = "escudos" que **protegem a ofensiva** quando você falha um dia. A cada 7 dias de ofensiva você ganha +1 escudo (máx. 5).
- Faltou e tinha escudo? A ofensiva é mantida. Faltou sem escudo? Ela zera — e você recomeça.

- **Segurança**: senhas **nunca** são salvas em texto puro (bcrypt) e a sessão usa **JWT** (header `Authorization: Bearer`).
- O token fica no `localStorage` e a sessão é reidratada (`/me`) ao recarregar a página.
- Na primeira execução, a comunidade já vem com posts de boas-vindas (seed automático).

> 💡 Persistência em arquivo JSON é proposital (zero setup, roda no Windows sem módulos nativos). Para produção, troque por Postgres/Prisma + um `JWT_SECRET` forte.

---

## 🧩 Estrutura

```
devpath-ai/
├── index.html            # Tailwind CDN + fontes + config de tema/animações
├── .env.example          # Modelo das variáveis de ambiente (copie p/ .env)
├── server/
│   ├── index.js           # API Express (monta as rotas + health)
│   ├── gemini.js          # Gemini: helpers (JSON/texto) + geração do roadmap
│   ├── features.js        # IA: escopo, boilerplate, code review, pato, README
│   ├── github.js          # Exportação para GitHub Issues (milestones + issues)
│   ├── auth.js            # Cadastro/login (bcrypt + JWT) e middlewares
│   ├── community.js       # Fórum: posts, comentários, votos, notificações
│   ├── me.js              # Perfil: dashboard, streak, roadmaps, notificações
│   ├── streak.js          # Lógica de ofensiva (streak) e defensiva (escudos)
│   ├── db.js              # Persistência em JSON + seed da comunidade
│   └── data/              # db.json (gerado em runtime, fora do git)
├── src/
│   ├── main.jsx           # Bootstrap do React (envolve com AuthProvider)
│   ├── App.jsx            # ⭐ Shell + ferramenta de Roadmap (setup/loader/dashboard)
│   ├── lib/api.js         # Cliente HTTP + token JWT
│   ├── auth/              # AuthContext + AuthModal (login/cadastro)
│   ├── community/         # Community.jsx (feed, votos, comentários, share)
│   ├── profile/           # Profile.jsx (dashboard, ofensiva/defensiva)
│   ├── roadmaps/          # MyRoadmaps.jsx (lista/continua/exclui roadmaps)
│   ├── features/          # Escopo, export GitHub, boilerplate, validador, pato, README
│   └── components/        # Modal.jsx, NotificationsBell.jsx
├── public/
│   └── terminal.svg       # Favicon
├── vite.config.js         # Proxy /api -> :3001
└── package.json
```

O front é modular: o **Roadmap** vive em `src/App.jsx`, a **comunidade** em `src/community/` e a **autenticação** em `src/auth/` — tudo com Functional Components + Hooks.

---

## 🐙 Sobre a integração com o GitHub

A conexão usa o endpoint **público** `https://api.github.com/users/{usuario}` — sem token. Ela busca seu perfil real (avatar, nº de repositórios e seguidores) e usa esses dados para "assinar" os commits de progresso que você gera ao concluir tarefas.

> ⚠️ A API pública do GitHub limita requisições não autenticadas a ~60/hora. Para um produto real, troque por **GitHub OAuth** + um backend que crie commits/issues de verdade no seu repositório.

---

Feito com 💚 para devs que querem sair do loop de tutoriais e enviar código pra produção.
