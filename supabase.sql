-- Rode no Supabase: SQL Editor > New query > Run.
create table if not exists public.tracker (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.tracker enable row level security;

create policy "dono le" on public.tracker
  for select to authenticated using (auth.uid() = user_id);
create policy "dono insere" on public.tracker
  for insert to authenticated with check (auth.uid() = user_id);
create policy "dono atualiza" on public.tracker
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono apaga" on public.tracker
  for delete to authenticated using (auth.uid() = user_id);
