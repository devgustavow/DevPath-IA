import type { Metadata, Viewport } from "next";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FinanceFlow — Controle Financeiro Pessoal",
    template: "%s · FinanceFlow",
  },
  description:
    "Acompanhe toda a sua vida financeira em um único lugar: contas, cartões, metas, investimentos, orçamento e um assistente com IA.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <StoreProvider>{children}</StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
