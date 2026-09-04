begin;

-- Text moderation now runs in the browser. RLS and auth.uid() still enforce
-- ownership, while the database RPC keeps rig + component writes atomic.
drop trigger if exists require_fresh_rig_moderation_before_update on public.rigs;
drop trigger if exists require_fresh_result_moderation_before_update on public.results;
drop function if exists private.require_fresh_rig_moderation();
drop function if exists private.require_fresh_result_moderation();

drop function if exists public.create_moderated_rig(uuid, text, text, text, text, jsonb, timestamptz);
drop function if exists public.update_moderated_rig(uuid, bigint, text, text, text, text, jsonb, timestamptz);

alter table public.rigs drop column if exists moderated_at;
alter table public.results drop column if exists moderated_at;

grant insert (owner_id, name, os, photo_url, notes) on public.rigs to authenticated;
grant update (name, os, photo_url, notes) on public.rigs to authenticated;
grant insert (rig_id, hardware_id, quantity) on public.rig_components to authenticated;
grant update (quantity) on public.rig_components to authenticated;
grant delete on public.rig_components to authenticated;
grant insert (
  submitter_id, model_id, quant_id, runtime_id, runtime_version, rig_id, component_id,
  component_quantity, decode_tps, prompt_tps, ttft_ms, context_length, batch_size,
  notes, repo_url, run_date
) on public.results to authenticated;
grant update (
  model_id, quant_id, runtime_id, runtime_version, rig_id, component_id,
  component_quantity, decode_tps, prompt_tps, ttft_ms, context_length, batch_size,
  notes, repo_url, run_date
) on public.results to authenticated;

grant execute on function public.create_rig(text, text, text, text, jsonb) to authenticated;
grant execute on function public.update_rig(bigint, text, text, text, text, jsonb) to authenticated;

commit;
