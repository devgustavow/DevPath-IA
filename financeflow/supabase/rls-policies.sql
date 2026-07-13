-- FinanceFlow — Políticas de Row Level Security (Supabase)
-- Cada usuário só enxerga os próprios dados. Aplique após `prisma db push`.

alter table users            enable row level security;
alter table accounts         enable row level security;
alter table credit_cards     enable row level security;
alter table categories       enable row level security;
alter table transactions     enable row level security;
alter table recurring_bills  enable row level security;
alter table goals            enable row level security;
alter table investments      enable row level security;
alter table trip_budgets     enable row level security;

create policy "own profile" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own accounts" on accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cards" on credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own recurring" on recurring_bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own goals" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own investments" on investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own trips" on trip_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: bucket de comprovantes, pasta por usuário
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

create policy "own receipts read" on storage.objects
  for select using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own receipts write" on storage.objects
  for insert with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
