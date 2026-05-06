-- cv_variants table for audience-specific resume variants

create table if not exists public.cv_variants (
  username     text not null,
  audience     text not null,
  data         jsonb not null,
  updated_at   timestamptz not null default now(),
  primary key (username, audience)
);

-- RLS
alter table public.cv_variants enable row level security;

-- cv_variants: 公开读，anon 可写（MCP 更新变体）
create policy "cv_variants_public_read"   on public.cv_variants for select using (true);
create policy "cv_variants_anon_insert"   on public.cv_variants for insert with check (true);
create policy "cv_variants_anon_update"   on public.cv_variants for update using (true) with check (true);
