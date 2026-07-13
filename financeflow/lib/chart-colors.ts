/**
 * Paletas de gráficos validadas (script validate_palette da skill dataviz):
 * banda de luminosidade, piso de croma, separação CVD adjacente e contraste ≥3:1
 * contra as superfícies reais (light #ffffff / dark #111827). Ordem fixa — nunca
 * ciclar; a 9ª série vira "Outros".
 */
export const CATEGORICAL_LIGHT = [
  "#3B82F6", // azul (marca)
  "#16A34A", // verde (marca)
  "#D97706", // âmbar
  "#7C3AED", // violeta
  "#E11D48", // rosa
  "#0D9488", // teal
  "#EA580C", // laranja
  "#DB2777", // magenta
] as const;

export const CATEGORICAL_DARK = [
  "#3B82F6",
  "#16A34A",
  "#D97706",
  "#8B5CF6",
  "#F43F5E",
  "#0D9488",
  "#EA580C",
  "#EC4899",
] as const;

/** Semânticos: entrada (verde) x saída (vermelho/rosa) — polaridade fixa */
export const INCOME_LIGHT = "#16A34A";
export const INCOME_DARK = "#22C55E";
export const EXPENSE_LIGHT = "#E11D48";
export const EXPENSE_DARK = "#F43F5E";
export const NEUTRAL_LINE_LIGHT = "#3B82F6";
export const NEUTRAL_LINE_DARK = "#60A5FA";

/** Chrome do gráfico */
export interface ChartChrome {
  grid: string;
  axis: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
  text: string;
}

export const CHART_CHROME: Record<"light" | "dark", ChartChrome> = {
  light: {
    grid: "#e2e8f0",
    axis: "#94a3b8",
    tick: "#64748b",
    tooltipBg: "#ffffff",
    tooltipBorder: "rgba(15,23,42,0.08)",
    text: "#0f172a",
  },
  dark: {
    grid: "#1f2937",
    axis: "#4b5563",
    tick: "#9ca3af",
    tooltipBg: "#1f2937",
    tooltipBorder: "rgba(255,255,255,0.08)",
    text: "#f9fafb",
  },
};

export function seriesColor(index: number, dark: boolean): string {
  const pal = dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  return pal[Math.min(index, pal.length - 1)];
}
