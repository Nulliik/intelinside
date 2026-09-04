begin;

create function public.create_rig(
  p_name text,
  p_os text,
  p_photo_url text,
  p_notes text,
  p_components jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_rig_id bigint;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Sign in to create a rig';
  end if;
  if jsonb_typeof(p_components) <> 'array' or jsonb_array_length(p_components) = 0 then
    raise exception using errcode = '22023', message = 'A rig must have at least one component';
  end if;

  insert into public.rigs (owner_id, name, os, photo_url, notes)
  values ((select auth.uid()), p_name, p_os, p_photo_url, p_notes)
  returning id into new_rig_id;

  insert into public.rig_components (rig_id, hardware_id, quantity)
  select new_rig_id, component.hardware_id, component.quantity
  from jsonb_to_recordset(p_components) as component(hardware_id text, quantity smallint);

  return new_rig_id;
end;
$$;

revoke all on function public.create_rig(text, text, text, text, jsonb) from public, anon;
grant execute on function public.create_rig(text, text, text, text, jsonb) to authenticated;

create function public.update_rig(
  p_rig_id bigint,
  p_name text,
  p_os text,
  p_photo_url text,
  p_notes text,
  p_components jsonb
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
  set name = p_name, os = p_os, photo_url = p_photo_url, notes = p_notes
  where id = p_rig_id
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

revoke all on function public.update_rig(bigint, text, text, text, text, jsonb) from public, anon;
grant execute on function public.update_rig(bigint, text, text, text, text, jsonb) to authenticated;

commit;
