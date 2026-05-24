-- Lock down anon RLS: revoke all write permissions and PAT visibility from anon.
-- Server-side writes must now use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Public SELECT is preserved on cv_resumes and cv_variants so unauthenticated
-- browsers (public profile pages) can still render resumes via the anon key.

-- cv_resumes: drop anon write policies, keep public read.
drop policy if exists "cv_resumes_anon_insert"   on public.cv_resumes;
drop policy if exists "cv_resumes_anon_update"   on public.cv_resumes;

-- cv_pat_tokens: drop ALL anon access. Tokens must never be readable or
-- writable from a browser; only the service role may touch this table.
drop policy if exists "cv_pat_tokens_anon_select" on public.cv_pat_tokens;
drop policy if exists "cv_pat_tokens_anon_insert" on public.cv_pat_tokens;
drop policy if exists "cv_pat_tokens_anon_update" on public.cv_pat_tokens;

-- cv_variants: drop anon write policies, keep public read.
drop policy if exists "cv_variants_anon_insert"   on public.cv_variants;
drop policy if exists "cv_variants_anon_update"   on public.cv_variants;
drop policy if exists "cv_variants_anon_delete"   on public.cv_variants;

-- Sanity: confirm the remaining policies are read-only "using (true)".
-- (Left as comments; existing cv_resumes_public_read and cv_variants_public_read
-- policies from prior migrations remain in effect.)
