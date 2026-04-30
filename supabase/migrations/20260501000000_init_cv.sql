-- cv 项目初始化迁移
-- 复用 raily-friends 所在的 Supabase project (kfofhszjhdhyuhfmlnrw)
-- 所有 cv 自己的表用 cv_ 前缀避免冲突

-- ============================================================
-- cv_resumes: 简历主表
-- ============================================================
create table if not exists public.cv_resumes (
  username     text primary key,
  data         jsonb not null,
  version      int  not null default 1,
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- cv_resume_versions: 历史版本（rollback 用）
-- ============================================================
create table if not exists public.cv_resume_versions (
  id           bigserial primary key,
  username     text not null references public.cv_resumes(username) on delete cascade,
  version      int  not null,
  data         jsonb not null,
  created_at   timestamptz not null default now(),
  unique (username, version)
);

create index if not exists cv_resume_versions_username_version_idx
  on public.cv_resume_versions (username, version desc);

-- ============================================================
-- cv_pat_tokens: Personal Access Token
-- ============================================================
create table if not exists public.cv_pat_tokens (
  id           uuid primary key default gen_random_uuid(),
  username     text not null,
  name         text not null,
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create index if not exists cv_pat_tokens_token_hash_idx
  on public.cv_pat_tokens (token_hash);

create index if not exists cv_pat_tokens_username_idx
  on public.cv_pat_tokens (username);

-- ============================================================
-- RLS：全部启用
-- ============================================================
alter table public.cv_resumes          enable row level security;
alter table public.cv_resume_versions  enable row level security;
alter table public.cv_pat_tokens       enable row level security;

-- 公开简历允许匿名读（公开页 cv.ha7ch.com/{username} 用 anon key）
drop policy if exists "cv_resumes_public_read" on public.cv_resumes;
create policy "cv_resumes_public_read"
  on public.cv_resumes
  for select
  using (true);

-- 历史版本和 PAT 都仅 service_role 可访问（默认策略 = 拒绝），不需要显式 policy
-- MCP server 用 SUPABASE_SERVICE_ROLE_KEY 绕过 RLS
