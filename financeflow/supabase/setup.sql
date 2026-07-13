-- ═══════════════════════════════════════════════════════════════════════════
-- FinanceFlow — Setup do Supabase (rode este arquivo no SQL Editor)
-- Cria o armazenamento em nuvem do estado do app, protegido por RLS:
-- cada usuário autenticado lê e escreve apenas o próprio registro.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.user_states (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_states enable row level security;

drop policy if exists "own state select" on public.user_states;
create policy "own state select" on public.user_states
  for select using (auth.uid() = user_id);

drop policy if exists "own state insert" on public.user_states;
create policy "own state insert" on public.user_states
  for insert with check (auth.uid() = user_id);

drop policy if exists "own state update" on public.user_states;
create policy "own state update" on public.user_states
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own state delete" on public.user_states;
create policy "own state delete" on public.user_states
  for delete using (auth.uid() = user_id);

-- Pronto! O app faz upsert em user_states automaticamente a cada alteração.
--
-- (Opcional, produção avançada): para migrar do JSONB para tabelas
-- normalizadas, use prisma/schema.prisma + supabase/rls-policies.sql.
