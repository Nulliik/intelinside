begin;

alter table public.rigs add column moderated_at timestamptz not null default now();
alter table public.results add column moderated_at timestamptz not null default now();

alter table public.rigs alter column moderated_at drop default;
alter table public.results alter column moderated_at drop default;

-- All user-authored writes now pass through the Edge Function. Keeping only
-- read/delete access prevents callers from forging the server-issued timestamp.
revoke all privileges on public.rigs, public.rig_components, public.results from authenticated;
grant select, delete on public.rigs, public.results to authenticated;
grant select on public.rig_components to authenticated;

revoke execute on function public.create_rig(text, text, text, text, jsonb) from authenticated;
revoke execute on function public.update_rig(bigint, text, text, text, text, jsonb) from authenticated;

create function private.require_fresh_rig_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.name is distinct from old.name
    or new.os is distinct from old.os
    or new.notes is distinct from old.notes
  ) and new.moderated_at is not distinct from old.moderated_at then
    raise exception using errcode = '23514', message = 'Rig text must be moderated before it is updated';
  end if;
  return new;
end;
$$;
revoke all on function private.require_fresh_rig_moderation() from public, anon, authenticated;

create trigger require_fresh_rig_moderation_before_update
before update of name, os, notes on public.rigs
for each row execute function private.require_fresh_rig_moderation();

create function private.require_fresh_result_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.runtime_version is distinct from old.runtime_version
    or new.notes is distinct from old.notes
  ) and new.moderated_at is not distinct from old.moderated_at then
    raise exception using errcode = '23514', message = 'Result text must be moderated before it is updated';
  end if;
  return new;
end;
$$;
revoke all on function private.require_fresh_result_moderation() from public, anon, authenticated;

create trigger require_fresh_result_moderation_before_update
before update of runtime_version, notes on public.results
for each row execute function private.require_fresh_result_moderation();

create function public.create_moderated_rig(
  p_owner_id uuid,
  p_name text,
  p_os text,
  p_photo_url text,
  p_notes text,
  p_components jsonb,
  p_moderated_at timestamptz
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_rig_id bigint;
begin
  if jsonb_typeof(p_components) <> 'array' or jsonb_array_length(p_components) = 0 then
    raise exception using errcode = '22023', message = 'A rig must have at least one component';
  end if;

  insert into public.rigs (owner_id, name, os, photo_url, notes, moderated_at)
  values (p_owner_id, p_name, p_os, p_photo_url, p_notes, p_moderated_at)
  returning id into new_rig_id;

  insert into public.rig_components (rig_id, hardware_id, quantity)
  select new_rig_id, component.hardware_id, component.quantity
  from jsonb_to_recordset(p_components) as component(hardware_id text, quantity smallint);

  return new_rig_id;
end;
$$;
revoke all on function public.create_moderated_rig(uuid, text, text, text, text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.create_moderated_rig(uuid, text, text, text, text, jsonb, timestamptz) to service_role;

create function public.update_moderated_rig(
  p_owner_id uuid,
  p_rig_id bigint,
  p_name text,
  p_os text,
  p_photo_url text,
  p_notes text,
  p_components jsonb,
  p_moderated_at timestamptz
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_rig_id bigint;
begin
  if jsonb_typeof(p_components) <> 'array' or jsonb_array_length(p_components) = 0 then
    raise exception using errcode = '22023', message = 'A rig must have at least one component';
  end if;

  update public.rigs
  set name = p_name,
      os = p_os,
      photo_url = p_photo_url,
      notes = p_notes,
      moderated_at = p_moderated_at
  where id = p_rig_id and owner_id = p_owner_id
  returning id into updated_rig_id;

  if updated_rig_id is null then
    raise exception using errcode = 'P0002', message = 'Rig not found or not owned by this user';
  end if;

  insert into public.rig_components (rig_id, hardware_id, quantity)
  select p_rig_id, component.hardware_id, component.quantity
  from jsonb_to_recordset(p_components) as component(hardware_id text, quantity smallint)
  on conflict (rig_id, hardware_id) do update set quantity = excluded.quantity;

  delete from public.rig_components as existing
  where existing.rig_id = p_rig_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_components) as component(hardware_id text, quantity smallint)
      where component.hardware_id = existing.hardware_id
    );

  return updated_rig_id;
end;
$$;
revoke all on function public.update_moderated_rig(uuid, bigint, text, text, text, text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.update_moderated_rig(uuid, bigint, text, text, text, text, jsonb, timestamptz) to service_role;

commit;
