-- Fix: add missing DELETE policy on cv_variants
-- Without this, anon delete calls silently fail (RLS blocks without error)
create policy "cv_variants_anon_delete" on public.cv_variants for delete using (true);
