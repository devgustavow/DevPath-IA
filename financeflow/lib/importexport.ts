import { AppState, Attachment, Transaction } from "./types";
import { todayISO, uid } from "./utils";

// ─── Importação de extratos (OFX / QIF / CSV) ────────────────────────────────

export interface ParsedRow {
  date: string;
  description: string;
  amount: number; // negativo = despesa
}

export function parseOFX(content: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const txBlocks = content.split(/<STMTTRN>/i).slice(1);
  for (const block of txBlocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, "i"));
      return m ? m[1].trim() : "";
    };
    const rawDate = get("DTPOSTED").slice(0, 8);
    const amount = parseFloat(get("TRNAMT").replace(",", "."));
    const memo = get("MEMO") || get("NAME") || "Transação importada";
    if (rawDate.length === 8 && !isNaN(amount)) {
      rows.push({
        date: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
        description: memo,
        amount,
      });
    }
  }
  return rows;
}

export function parseQIF(content: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const blocks = content.split(/^\^/m);
  for (const block of blocks) {
    let date = "";
    let amount = NaN;
    let desc = "";
    for (const line of block.split(/\r?\n/)) {
      const code = line[0];
      const val = line.slice(1).trim();
      if (code === "D") {
        const m = val.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
        if (m) {
          const y = m[3].length === 2 ? `20${m[3]}` : m[3];
          date = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
        }
      } else if (code === "T") amount = parseFloat(val.replace(/\./g, "").replace(",", "."));
      else if (code === "P" || code === "M") desc = desc || val;
    }
    if (date && !isNaN(amount)) rows.push({ date, description: desc || "Transação importada", amount });
  }
  return rows;
}

/** CSV: espera colunas data, descricao, valor (detecta separador , ou ;) */
export function parseCSV(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].toLowerCase().split(sep).map((h) => h.trim().replace(/"/g, ""));
  const di = header.findIndex((h) => /data|date/.test(h));
  const de = header.findIndex((h) => /desc|memo|hist/.test(h));
  const va = header.findIndex((h) => /valor|amount|value/.test(h));
  if (di === -1 || va === -1) return [];
  const rows: ParsedRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const rawDate = cols[di] ?? "";
    let date = "";
    const br = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    const isoM = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoM) date = `${isoM[1]}-${isoM[2]}-${isoM[3]}`;
    else if (br) {
      const y = br[3].length === 2 ? `20${br[3]}` : br[3];
      date = `${y}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
    }
    const amount = parseFloat((cols[va] ?? "").replace(/R\$\s?/, "").replace(/\./g, "").replace(",", "."));
    if (date && !isNaN(amount)) {
      rows.push({ date, description: cols[de] ?? "Transação importada", amount });
    }
  }
  return rows;
}

export function parseStatement(fileName: string, content: string): ParsedRow[] {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "ofx") return parseOFX(content);
  if (ext === "qif") return parseQIF(content);
  return parseCSV(content);
}

/** Converte linhas importadas em transações, com categorização automática */
export function rowsToTransactions(rows: ParsedRow[], accountId: string, state: AppState): Transaction[] {
  return rows.map((r) => ({
    id: uid("tx"),
    type: r.amount >= 0 ? ("receita" as const) : ("despesa" as const),
    amount: Math.abs(r.amount),
    description: r.description,
    categoryId: guessCategory(r.description, state),
    accountId,
    paymentMethod: "transferencia" as const,
    date: r.date,
    tags: ["importado"],
    status: "efetivada" as const,
    createdAt: todayISO(),
  }));
}

/** Categorização automática por palavras-chave (mesma heurística do OCR) */
export function guessCategory(description: string, state: AppState): string {
  const d = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const rules: [RegExp, string][] = [
    [/mercado|superm|carrefour|assai|atacad|hortifruti|padaria|acougue/, "cat-mercado"],
    [/ifood|restaur|hamburg|pizz|sushi|lanche|cafe|churrasc/, "cat-restaurante"],
    [/uber|99|taxi|metro|onibus|estacion/, "cat-transporte"],
    [/posto|shell|ipiranga|gasolina|etanol|combust/, "cat-combustivel"],
    [/aluguel|condominio|energia|luz|agua|internet|fibra|claro|vivo|tim/, "cat-moradia"],
    [/netflix|spotify|prime|disney|hbo|icloud|assinatura|youtube/, "cat-assinaturas"],
    [/farmacia|droga|medic|consulta|exame|plano de saude|hospital/, "cat-saude"],
    [/academia|smartfit|gym/, "cat-academia"],
    [/curso|udemy|alura|livro|faculdade|escola/, "cat-educacao"],
    [/petz|petlove|veterinari|racao/, "cat-pets"],
    [/cinema|show|ingresso|steam|playstation|xbox|bar /, "cat-lazer"],
    [/amazon|kabum|magalu|mercado livre|eletron|notebook|celular/, "cat-tecnologia"],
    [/passag|hotel|airbnb|hospeda|viagem/, "cat-viagem"],
    [/salario|pagamento|provento|pix recebido/, "cat-salario"],
    [/aporte|tesouro|cdb|invest/, "cat-investimentos"],
  ];
  for (const [re, cat] of rules) {
    if (re.test(d)) return cat;
  }
  return "cat-outros";
}

// ─── OCR de comprovantes (simulado — em produção: visão computacional) ──────

export function simulateOcr(fileName: string, state: AppState): NonNullable<Attachment["ocr"]> {
  // Deriva valores plausíveis e estáveis a partir do nome do arquivo
  let hash = 0;
  for (const ch of fileName) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const merchants = [
    "Supermercado Pão de Açúcar",
    "Posto Shell",
    "Drogasil",
    "Restaurante Coco Bambu",
    "Amazon Brasil",
    "Petz",
  ];
  const merchant = merchants[hash % merchants.length];
  const amount = Math.round((30 + (hash % 32000) / 100) * 100) / 100;
  return {
    amount,
    date: todayISO(),
    merchant,
    suggestedCategoryId: guessCategory(merchant, state),
  };
}

// ─── Exportação (CSV / Excel / PDF) ──────────────────────────────────────────

export function transactionsToCSV(state: AppState, txs: Transaction[]): string {
  const head = ["Data", "Tipo", "Descrição", "Categoria", "Conta", "Cartão", "Forma de pagamento", "Valor", "Status", "Tags"];
  const lines = txs.map((t) => {
    const cat = state.categories.find((c) => c.id === t.categoryId)?.name ?? "";
    const acc = state.accounts.find((a) => a.id === t.accountId)?.name ?? "";
    const card = state.cards.find((c) => c.id === t.cardId)?.name ?? "";
    const value = (t.type === "despesa" ? -t.amount : t.amount).toFixed(2).replace(".", ",");
    return [t.date, t.type, `"${t.description.replace(/"/g, '""')}"`, cat, acc, card, t.paymentMethod, value, t.status, t.tags.join("|")].join(";");
  });
  return "﻿" + [head.join(";"), ...lines].join("\n");
}

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(state: AppState, txs: Transaction[], name = "financeflow-transacoes.csv"): void {
  downloadFile(name, transactionsToCSV(state, txs), "text/csv;charset=utf-8");
}

/** Excel via HTML table (abre nativamente no Excel/LibreOffice) */
export function exportExcel(state: AppState, txs: Transaction[], name = "financeflow-transacoes.xls"): void {
  const rows = txs
    .map((t) => {
      const cat = state.categories.find((c) => c.id === t.categoryId)?.name ?? "";
      const acc = state.accounts.find((a) => a.id === t.accountId)?.name ?? "";
      const value = t.type === "despesa" ? -t.amount : t.amount;
      return `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.description}</td><td>${cat}</td><td>${acc}</td><td>${value.toFixed(2)}</td><td>${t.status}</td></tr>`;
    })
    .join("");
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Valor</th><th>Status</th></tr>${rows}</table></body></html>`;
  downloadFile(name, html, "application/vnd.ms-excel");
}

/** PDF via janela de impressão do navegador */
export function exportPDF(title: string, bodyHtml: string): void {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:32px;color:#0f172a}
      h1{font-size:20px;border-bottom:2px solid #22C55E;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}
      th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
      th{background:#f8fafc}
      .neg{color:#dc2626}.pos{color:#16a34a}
    </style></head><body><h1>${title}</h1>${bodyHtml}
    <script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
}
