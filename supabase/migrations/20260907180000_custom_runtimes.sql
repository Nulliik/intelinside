begin;

-- A changed runtime becomes something a person owns and shows off, rather than three strings retyped on every
-- result. The base runtime stays catalog data; the build on top of it is user content, so it is shaped like a rig:
-- owned, publicly readable, edited only by its owner.
--
-- One deliberate difference from rigs. A result must be on a rig you own, because a rig is your machine. A build is
-- not: a public fork is a real thing anyone can run, and if ten people running the same fork each had to register
-- their own copy, the comparability this exists for would be gone. So results may reference any build, and only the
-- owner may edit it.
create table if not exists public.custom_runtimes (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  runtime_id text not null references public.runtimes (id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  repo_url text not null check (repo_url ~* '^https?://'),
  -- Required and short: it is what the picker and the board row show, so it cannot be blank.
  summary text not null check (length(btrim(summary)) between 1 and 280),
  notes text check (notes is null or length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists custom_runtimes_owner_idx on public.custom_runtimes (owner_id, created_at desc, id desc);
create index if not exists custom_runtimes_runtime_idx on public.custom_runtimes (runtime_id, created_at desc, id desc);

-- The existing touch function only stamps updated_at, so it serves any table with that column.
create trigger touch_custom_runtime_before_update
before update on public.custom_runtimes
for each row execute function private.touch_rig_updated_at();

alter table public.custom_runtimes enable row level security;
create policy custom_runtimes_public_read on public.custom_runtimes for select to anon, authenticated using (true);
create policy custom_runtimes_owner_insert on public.custom_runtimes for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy custom_runtimes_owner_update on public.custom_runtimes for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy custom_runtimes_owner_delete on public.custom_runtimes for delete to authenticated
  using (owner_id = (select auth.uid()));
grant select on public.custom_runtimes to anon, authenticated;
grant insert, update, delete on public.custom_runtimes to authenticated;

-- The result now points at the build instead of describing it. The revision stays here on purpose: the build is the
-- identity, the revision pins the individual run, and a fork moves week to week.
alter table public.results add column if not exists custom_runtime_id bigint references public.custom_runtimes (id) on delete restrict;
alter table public.results rename column mod_revision to revision;
alter table public.results drop column if exists mod_source_url;
alter table public.results drop column if exists execution;

alter table public.results drop constraint if exists results_modification_shape;
alter table public.results drop constraint if exists results_execution_valid;
alter table public.results drop constraint if exists results_mod_revision_length;

alter table public.results add constraint results_revision_length
  check (revision is null or char_length(revision) <= 80);
-- A revision only means something against a build.
alter table public.results add constraint results_revision_needs_build
  check (custom_runtime_id is not null or revision is null);

create index if not exists results_custom_runtime_idx on public.results (custom_runtime_id, decode_tps desc, id desc)
  where hidden = false;
-- Boards read stock rows far more often than the rest.
drop index if exists results_board_stock_idx;
create index results_board_stock_idx on public.results (model_id, quant_id, decode_tps desc, id desc)
  where hidden = false and custom_runtime_id is null;

comment on table public.custom_runtimes is
  'A changed runtime someone owns: a fork, a patch, a custom kernel. Results may reference any build; only the owner edits it.';
comment on column public.results.custom_runtime_id is
  'The build this run used. Null means stock — the released runtime, however configured or built.';
comment on column public.results.revision is
  'Builds only: the exact revision behind this number — a commit, a tag, or a build id.';

commit;
