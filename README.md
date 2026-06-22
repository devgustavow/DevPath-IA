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
- **Variáveis** (`.env`): `GEMINI_API_KEY`, `GEMINI_MODEL` (padrão `gemini-2.0-flash`), `PORT` (padrão `3001`).
- **Sem chave / IA fora do ar?** O front detecta o erro e usa o **roadmap de exemplo** automaticamente, com um aviso. Nada quebra.

> ⚠️ **Nunca** commite seu `.env` — ele já está no `.gitignore`. Use o `.env.example` como modelo.

---

## 🧩 Estrutura

```
devpath-ai/
├── index.html           # Tailwind CDN + fontes + config de tema/animações
├── .env.example         # Modelo das variáveis de ambiente (copie p/ .env)
├── server/
│   ├── index.js          # API Express (POST /api/roadmap, GET /api/health)
│   └── gemini.js         # Integração com o Gemini (prompt + schema JSON)
├── src/
│   ├── main.jsx          # Bootstrap do React
│   └── App.jsx           # ⭐ App completa (formulário, loader e dashboard)
├── public/
│   └── terminal.svg      # Favicon
├── vite.config.js        # Proxy /api -> :3001
└── package.json
```

A UI vive em **`src/App.jsx`** — Functional Components + Hooks (`useState`, `useEffect`, `useMemo`, `useRef`), comentado onde há lógica relevante.

---

## 🐙 Sobre a integração com o GitHub

A conexão usa o endpoint **público** `https://api.github.com/users/{usuario}` — sem token. Ela busca seu perfil real (avatar, nº de repositórios e seguidores) e usa esses dados para "assinar" os commits de progresso que você gera ao concluir tarefas.

> ⚠️ A API pública do GitHub limita requisições não autenticadas a ~60/hora. Para um produto real, troque por **GitHub OAuth** + um backend que crie commits/issues de verdade no seu repositório.

---

Feito com 💚 para devs que querem sair do loop de tutoriais e enviar código pra produção.
