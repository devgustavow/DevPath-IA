# 🧭 DevPath AI — O Arquiteto de Carreira para Devs

> Pare de assistir. Comece a construir. **O fim do Tutorial Hell** via Engenharia Reversa de Projetos (Project-Based Learning).

DevPath AI recebe um **projeto real** que você quer construir, faz a "engenharia reversa" dele e devolve um **roadmap prático em sprints semanais** — onde cada tarefa é *construir um módulo de código de verdade*, nunca "estudar teoria".

![stack](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=000) ![stack](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=fff) ![stack](https://img.shields.io/badge/Tailwind-CDN-38bdf8?logo=tailwindcss&logoColor=fff) ![stack](https://img.shields.io/badge/lucide--react-icons-10b981)

---

## ✨ Funcionalidades

| # | Tela / Recurso | O que faz |
|---|----------------|-----------|
| 1 | **Setup do Dev** | Formulário com projeto desejado, nível, horas/semana e stack (tags). |
| 2 | **Terminal de IA** | Loader estilo terminal rodando comandos sequenciais (~3s) fazendo "engenharia reversa". |
| 3 | **Dashboard / Roadmap** | Resumo (semanas, esforço, conclusão prevista, progresso), mapa de dependências e timeline em sprints. |
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

```bash
# 1. Instalar dependências
npm install

# 2. Subir o servidor de desenvolvimento
npm run dev
```

Abra o endereço que o Vite mostrar (normalmente <http://localhost:5173>).

```bash
# Build de produção
npm run build
npm run preview
```

> O Tailwind é carregado via **Play CDN** (em `index.html`), então não há etapa de build de CSS — perfeito para copiar/colar e testar no Vite ou CodeSandbox.

---

## 🧩 Estrutura

```
devpath-ai/
├── index.html          # Tailwind CDN + fontes + config de tema/animações
├── src/
│   ├── main.jsx         # Bootstrap do React
│   └── App.jsx          # ⭐ Aplicação completa (formulário, loader e dashboard)
├── public/
│   └── terminal.svg     # Favicon
├── vite.config.js
└── package.json
```

Todo o app vive em **`src/App.jsx`** — Functional Components + Hooks (`useState`, `useEffect`, `useMemo`, `useRef`), comentado onde há lógica relevante.

---

## 🐙 Sobre a integração com o GitHub

A conexão usa o endpoint **público** `https://api.github.com/users/{usuario}` — sem token e sem backend. Ela busca seu perfil real (avatar, nº de repositórios e seguidores) e usa esses dados para "assinar" os commits de progresso que você gera ao concluir tarefas.

> ⚠️ A API pública do GitHub limita requisições não autenticadas a ~60/hora. Para um produto real, troque por **GitHub OAuth** + um backend que crie commits/issues de verdade no seu repositório.

---

Feito com 💚 para devs que querem sair do loop de tutoriais e enviar código pra produção.
