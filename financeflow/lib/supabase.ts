import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (Auth + banco). Se as variáveis de ambiente não estiverem
 * configuradas, `supabase` é null e o app roda em modo demo (localStorage).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const isSupabaseConfigured = Boolean(supabase);

/** Mensagens de erro do Supabase Auth traduzidas para PT-BR */
export function translateAuthError(message: string): string {
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, "E-mail ou senha incorretos."],
    [/user already registered/i, "Este e-mail já está cadastrado. Tente entrar."],
    [/email not confirmed/i, "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada)."],
    [/password should be at least/i, "A senha precisa de pelo menos 6 caracteres."],
    [/rate limit|too many requests/i, "Muitas tentativas. Aguarde alguns instantes e tente de novo."],
    [/unable to validate email|invalid email/i, "Informe um e-mail válido."],
    [/provider is not enabled/i, "Este provedor de login não está habilitado no projeto Supabase."],
    [/network|fetch/i, "Falha de conexão com o servidor. Verifique sua internet."],
  ];
  for (const [re, msg] of map) {
    if (re.test(message)) return msg;
  }
  return message;
}
