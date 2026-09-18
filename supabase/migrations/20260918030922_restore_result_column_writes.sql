begin;

-- These columns were added after the original column-level result grants.
-- Browser submissions include them even when their values are null.
grant insert (runtime_flags, custom_runtime_id, revision),
      update (runtime_flags, custom_runtime_id, revision)
on public.results to authenticated;

commit;
