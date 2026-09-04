/Users/jzck/.zshenv:.:2: no such file or directory: /Users/jzck/.cargo/env
/Users/jzck/.zshenv:.:2: no such file or directory: /Users/jzck/.cargo/env
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key,
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  handle text not null unique,
  name text,
  avatar_url text not null default '',
  bio text,
  created_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle = lower(handle) and handle ~ '^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$')
);

create table public.quants (
  id text primary key,
  label text not null,
  bits smallint not null check (bits > 0),
  format text not null
);

create table public.models (
  id text primary key,
  name text not null,
  family text not null,
  params text not null,
  architecture text not null check (architecture in ('dense', 'moe')),
  active_params text,
  source_url text not null,
  logo_url text,
  brand_color text
);

create table public.model_quants (
  model_id text not null references public.models (id) on delete cascade,
  quant_id text not null references public.quants (id) on delete restrict,
  primary key (model_id, quant_id)
);
create index model_quants_quant_id_idx on public.model_quants (quant_id);

create table public.runtimes (
  id text primary key,
  name text not null,
  logo_url text not null default '',
  repo_url text not null,
  color text not null
);

create table public.hardware (
  id text primary key,
  type text not null check (type in ('cpu', 'gpu', 'igpu', 'npu', 'ram')),
  vendor text not null,
  name text not null,
  series text,
  specs jsonb not null default '{}'::jsonb check (jsonb_typeof(specs) = 'object'),
  release_date date,
  image_url text,
  source text not null default 'seeded' check (source in ('seeded', 'community'))
);
create index hardware_type_vendor_name_idx on public.hardware (type, vendor, name);

create table public.rigs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  os text not null default '',
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rigs_owner_created_idx on public.rigs (owner_id, created_at desc, id desc);

create table public.rig_components (
  rig_id bigint not null references public.rigs (id) on delete cascade,
  hardware_id text not null references public.hardware (id) on delete restrict,
  quantity smallint not null check (quantity > 0),
  primary key (rig_id, hardware_id)
);
create index rig_components_hardware_id_idx on public.rig_components (hardware_id);

create table public.results (
  id bigint generated always as identity primary key,
  submitter_id uuid not null references public.profiles (id) on delete cascade,
  model_id text not null,
  quant_id text not null,
  runtime_id text not null references public.runtimes (id) on delete restrict,
  runtime_version text not null check (length(btrim(runtime_version)) between 1 and 80),
  rig_id bigint not null references public.rigs (id) on delete cascade,
  component_id text,
  component_quantity smallint,
  decode_tps numeric not null check (decode_tps > 0),
  prompt_tps numeric check (prompt_tps > 0),
  ttft_ms numeric check (ttft_ms > 0),
  context_length integer check (context_length > 0),
  batch_size integer check (batch_size > 0),
  notes text,
  repo_url text not null check (length(btrim(repo_url)) > 0),
  run_date date not null,
  verification_status text not null default 'self_reported' check (verification_status in ('self_reported', 'community_verified')),
  confirmations_count integer not null default 0 check (confirmations_count >= 0),
  flags_count integer not null default 0 check (flags_count >= 0),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint results_model_quant_fkey foreign key (model_id, quant_id) references public.model_quants (model_id, quant_id) on delete restrict,
  constraint results_component_membership_fkey foreign key (rig_id, component_id) references public.rig_components (rig_id, hardware_id) on delete restrict,
  constraint results_component_pair_check check (
    (component_id is null and component_quantity is null)
    or (component_id is not null and component_quantity is not null and component_quantity > 0)
  )
);
create index results_submitter_created_idx on public.results (submitter_id, created_at desc, id desc);
create index results_rig_created_idx on public.results (rig_id, created_at desc, id desc);
create index results_board_decode_idx on public.results (model_id, quant_id, decode_tps desc, id desc) where hidden = false;
create index results_model_quant_idx on public.results (model_id, quant_id);
create index results_runtime_id_idx on public.results (runtime_id);
create index results_component_id_idx on public.results (component_id) where component_id is not null;

create table public.result_confirmations (
  result_id bigint not null references public.results (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (result_id, user_id)
);
create index result_confirmations_user_id_idx on public.result_confirmations (user_id);

create table public.result_flags (
  result_id bigint not null references public.results (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('implausible', 'wrong_hardware', 'duplicate', 'spam', 'other')),
  note text,
  created_at timestamptz not null default now(),
  primary key (result_id, user_id)
);
create index result_flags_user_id_idx on public.result_flags (user_id);

create function private.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_handle text;
begin
  profile_handle := lower(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(new.email, '@', 1),
    new.id::text
  ));

  insert into public.profiles (id, auth_user_id, handle, name, avatar_url, bio, created_at)
  values (
    new.id,
    new.id,
    profile_handle,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    new.raw_user_meta_data ->> 'bio',
    new.created_at
  )
  on conflict (id) do update set
    auth_user_id = excluded.auth_user_id,
    handle = excluded.handle,
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio;

  return new;
end;
$$;
revoke all on function private.sync_profile_from_auth() from public, anon, authenticated;

create trigger sync_profile_after_auth_change
after insert or update of raw_user_meta_data, email on auth.users
for each row execute function private.sync_profile_from_auth();

insert into public.profiles (id, auth_user_id, handle, name, avatar_url, bio, created_at)
select
  id,
  id,
  lower(coalesce(raw_user_meta_data ->> 'user_name', raw_user_meta_data ->> 'preferred_username', split_part(email, '@', 1), id::text)),
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  coalesce(raw_user_meta_data ->> 'avatar_url', ''),
  raw_user_meta_data ->> 'bio',
  created_at
from auth.users
on conflict (id) do update set
  auth_user_id = excluded.auth_user_id,
  handle = excluded.handle,
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

create function private.validate_result()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  available_quantity smallint;
begin
  if not exists (
    select 1 from public.rigs
    where id = new.rig_id and owner_id = new.submitter_id
  ) then
    raise exception using errcode = '23514', message = 'Result rig must belong to the submitter';
  end if;

  if new.component_id is not null then
    select quantity into available_quantity
    from public.rig_components
    where rig_id = new.rig_id and hardware_id = new.component_id;

    if available_quantity is null or new.component_quantity > available_quantity then
      raise exception using errcode = '23514', message = 'Result component quantity exceeds the rig configuration';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.validate_result() from public, anon, authenticated;

create trigger validate_result_before_write
before insert or update of submitter_id, rig_id, component_id, component_quantity on public.results
for each row execute function private.validate_result();

create function private.touch_rig_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_rig_updated_at() from public, anon, authenticated;

create trigger touch_rig_before_update
before update on public.rigs
for each row execute function private.touch_rig_updated_at();

create function private.touch_result_and_reset_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  delete from public.result_confirmations where result_id = old.id;
  new.confirmations_count := 0;
  new.verification_status := 'self_reported';
  return new;
end;
$$;
revoke all on function private.touch_result_and_reset_verification() from public, anon, authenticated;

create trigger reset_result_verification_before_edit
before update of model_id, quant_id, runtime_id, runtime_version, rig_id, component_id, component_quantity,
  decode_tps, prompt_tps, ttft_ms, context_length, batch_size, notes, repo_url, run_date
on public.results
for each row execute function private.touch_result_and_reset_verification();

create function private.refresh_result_confirmation_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_result_id bigint := coalesce(new.result_id, old.result_id);
  total integer;
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  select count(*)::integer into total
  from public.result_confirmations
  where result_id = target_result_id;

  update public.results
  set confirmations_count = total,
      verification_status = case when total >= 3 then 'community_verified' else 'self_reported' end
  where id = target_result_id;

  return coalesce(new, old);
end;
$$;
revoke all on function private.refresh_result_confirmation_count() from public, anon, authenticated;

create trigger refresh_result_after_confirmation
after insert or delete on public.result_confirmations
for each row execute function private.refresh_result_confirmation_count();

create function private.refresh_result_flag_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_result_id bigint := coalesce(new.result_id, old.result_id);
  total integer;
begin
  select count(*)::integer into total
  from public.result_flags
  where result_id = target_result_id;

  update public.results
  set flags_count = total,
      hidden = total >= 3
  where id = target_result_id;

  return coalesce(new, old);
end;
$$;
revoke all on function private.refresh_result_flag_count() from public, anon, authenticated;

create trigger refresh_result_after_flag
after insert or update or delete on public.result_flags
for each row execute function private.refresh_result_flag_count();

alter table public.profiles enable row level security;
alter table public.models enable row level security;
alter table public.quants enable row level security;
alter table public.model_quants enable row level security;
alter table public.runtimes enable row level security;
alter table public.hardware enable row level security;
alter table public.rigs enable row level security;
alter table public.rig_components enable row level security;
alter table public.results enable row level security;
alter table public.result_confirmations enable row level security;
alter table public.result_flags enable row level security;

revoke all on table public.profiles, public.models, public.quants, public.model_quants,
  public.runtimes, public.hardware, public.rigs, public.rig_components, public.results,
  public.result_confirmations, public.result_flags from anon, authenticated;

grant select on table public.profiles, public.models, public.quants, public.model_quants,
  public.runtimes, public.hardware, public.rigs, public.rig_components, public.results
  to anon, authenticated;

grant update (name, avatar_url, bio) on public.profiles to authenticated;
grant insert (owner_id, name, os, photo_url, notes) on public.rigs to authenticated;
grant update (name, os, photo_url, notes) on public.rigs to authenticated;
grant delete on public.rigs to authenticated;
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
grant delete on public.results to authenticated;
grant select, insert, delete on public.result_confirmations to authenticated;
grant select, insert, update, delete on public.result_flags to authenticated;
grant usage, select on sequence public.rigs_id_seq, public.results_id_seq to authenticated;

create policy profiles_public_read on public.profiles
for select to anon, authenticated using (true);
create policy profiles_owner_update on public.profiles
for update to authenticated
using (id = (select auth.uid()) and auth_user_id = (select auth.uid()))
with check (id = (select auth.uid()) and auth_user_id = (select auth.uid()));

create policy models_public_read on public.models for select to anon, authenticated using (true);
create policy quants_public_read on public.quants for select to anon, authenticated using (true);
create policy model_quants_public_read on public.model_quants for select to anon, authenticated using (true);
create policy runtimes_public_read on public.runtimes for select to anon, authenticated using (true);
create policy hardware_public_read on public.hardware for select to anon, authenticated using (true);

create policy rigs_public_read on public.rigs for select to anon, authenticated using (true);
create policy rigs_owner_insert on public.rigs for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy rigs_owner_update on public.rigs for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy rigs_owner_delete on public.rigs for delete to authenticated
using (owner_id = (select auth.uid()));

create policy rig_components_public_read on public.rig_components
for select to anon, authenticated using (true);
create policy rig_components_owner_insert on public.rig_components for insert to authenticated
with check (exists (
  select 1 from public.rigs where rigs.id = rig_components.rig_id and rigs.owner_id = (select auth.uid())
));
create policy rig_components_owner_update on public.rig_components for update to authenticated
using (exists (
  select 1 from public.rigs where rigs.id = rig_components.rig_id and rigs.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.rigs where rigs.id = rig_components.rig_id and rigs.owner_id = (select auth.uid())
));
create policy rig_components_owner_delete on public.rig_components for delete to authenticated
using (exists (
  select 1 from public.rigs where rigs.id = rig_components.rig_id and rigs.owner_id = (select auth.uid())
));

create policy results_public_read on public.results for select to anon
using (not hidden);
create policy results_authenticated_read on public.results for select to authenticated
using (not hidden or submitter_id = (select auth.uid()));
create policy results_owner_insert on public.results for insert to authenticated
with check (
  submitter_id = (select auth.uid())
  and exists (select 1 from public.rigs where rigs.id = results.rig_id and rigs.owner_id = (select auth.uid()))
);
create policy results_owner_update on public.results for update to authenticated
using (submitter_id = (select auth.uid()))
with check (
  submitter_id = (select auth.uid())
  and exists (select 1 from public.rigs where rigs.id = results.rig_id and rigs.owner_id = (select auth.uid()))
);
create policy results_owner_delete on public.results for delete to authenticated
using (submitter_id = (select auth.uid()));

create policy confirmations_participant_read on public.result_confirmations for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.results
    where results.id = result_confirmations.result_id and results.submitter_id = (select auth.uid())
  )
);
create policy confirmations_user_insert on public.result_confirmations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.results
    where results.id = result_confirmations.result_id and results.submitter_id <> (select auth.uid())
  )
);
create policy confirmations_user_delete on public.result_confirmations for delete to authenticated
using (user_id = (select auth.uid()));

create policy flags_participant_read on public.result_flags for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.results
    where results.id = result_flags.result_id and results.submitter_id = (select auth.uid())
  )
);
create policy flags_user_insert on public.result_flags for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.results
    where results.id = result_flags.result_id and results.submitter_id <> (select auth.uid())
  )
);
create policy flags_user_update on public.result_flags for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy flags_user_delete on public.result_flags for delete to authenticated
using (user_id = (select auth.uid()));

commit;
