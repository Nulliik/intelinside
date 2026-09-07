begin;

-- Store only a Storage object name. A complete URL is untrusted input and must
-- never become a server-side fetch target in the OG renderer.
alter table public.rigs add column photo_path text;

with legacy_photo_paths as (
  select
    rigs.id,
    substring(rigs.photo_url from '^https://[^/]+/storage/v1/object/public/rig-photos/(.+)$') as photo_path
  from public.rigs
  where rigs.photo_url is not null
)
update public.rigs
set photo_path = legacy_photo_paths.photo_path
from legacy_photo_paths
where rigs.id = legacy_photo_paths.id
  and legacy_photo_paths.photo_path is not null
  and exists (
    select 1
    from storage.objects
    where bucket_id = 'rig-photos'
      and name = legacy_photo_paths.photo_path
      and owner_id::text = rigs.owner_id::text
  );

create function private.require_owned_rig_photo_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.photo_path is not null and (
    split_part(new.photo_path, '/', 1) <> (select auth.uid())::text
    or new.photo_path ~ '(^|/)[.]{1,2}(/|$)'
    or not exists (
      select 1
      from storage.objects
      where bucket_id = 'rig-photos'
        and name = new.photo_path
        and owner_id::text = (select auth.uid())::text
    )
  ) then
    raise exception using
      errcode = '23514',
      message = 'Rig photo must be an image you uploaded to rig-photos';
  end if;

  return new;
end;
$$;
revoke all on function private.require_owned_rig_photo_path() from public, anon, authenticated;

drop function public.create_rig(text, text, text, text, jsonb);
drop function public.update_rig(bigint, text, text, text, text, jsonb);

create trigger require_owned_rig_photo_path_before_write
before insert or update of photo_path on public.rigs
for each row execute function private.require_owned_rig_photo_path();

-- Keep historical values for review instead of destroying them. They are no
-- longer writable or read by the application and must never be fetched.
alter table public.rigs rename column photo_url to legacy_photo_url;
revoke insert (legacy_photo_url), update (legacy_photo_url) on public.rigs from authenticated;
comment on column public.rigs.legacy_photo_url is
  'Legacy untrusted photo URL retained for migration history; never use as a fetch target.';

grant insert (owner_id, name, os, photo_path, notes) on public.rigs to authenticated;
grant update (name, os, photo_path, notes) on public.rigs to authenticated;

create function public.create_rig(
  p_name text,
  p_os text,
  p_photo_path text,
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

  insert into public.rigs (owner_id, name, os, photo_path, notes)
  values ((select auth.uid()), p_name, p_os, p_photo_path, p_notes)
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
  p_photo_path text,
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
  set name = p_name, os = p_os, photo_path = p_photo_path, notes = p_notes
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
