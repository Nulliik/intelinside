begin;

-- Two things a result needs beyond model, quant, runtime, and version, because none of those determine the number.
--
-- `runtime_flags` is the settings and build options behind the run: which backend was compiled in, whether flash
-- attention is on, how the KV cache is quantized. Free text on purpose — the vocabulary differs per runtime and is
-- not settled, so this captures what people actually write before any of it becomes a controlled list.
--
-- `execution` is the one that matters for the boards. A fork with a hand-tuned attention kernel can beat the released
-- runtime by a wide margin on the same silicon, and on a mixed board that reads as a hardware win. So a result says
-- whether it came off a stock runtime or a changed one, boards rank stock alone unless modified results are asked
-- for, and a modified run carries the fork and the revision that produced it. An implementation changes week to week;
-- "I used my custom kernel" is not reproducible, `github.com/you/vllm @ a8192fe` is.
alter table public.results add column if not exists runtime_flags text;
alter table public.results add column if not exists execution text not null default 'stock';
alter table public.results add column if not exists mod_source_url text;
alter table public.results add column if not exists mod_revision text;

alter table public.results drop constraint if exists results_execution_valid;
alter table public.results add constraint results_execution_valid
  check (execution in ('stock', 'modified'));

alter table public.results drop constraint if exists results_runtime_flags_length;
alter table public.results add constraint results_runtime_flags_length
  check (runtime_flags is null or char_length(runtime_flags) <= 200);

alter table public.results drop constraint if exists results_mod_revision_length;
alter table public.results add constraint results_mod_revision_length
  check (mod_revision is null or char_length(mod_revision) <= 80);

-- A stock run carries no modification fields, and "modified" without a source or a revision is a label nobody can act
-- on, so the database refuses both shapes rather than trusting the form to have got it right.
alter table public.results drop constraint if exists results_modification_shape;
alter table public.results add constraint results_modification_shape check (
  case execution
    when 'stock' then mod_source_url is null and mod_revision is null
    else mod_source_url is not null or mod_revision is not null
  end
);

-- Boards read stock rows far more often than the rest, so they get their own index.
create index if not exists results_board_stock_idx
  on public.results (model_id, quant_id, decode_tps desc, id desc)
  where hidden = false and execution = 'stock';

comment on column public.results.runtime_flags is
  'Flags and settings behind the run: backend, attention kernel, KV cache precision. Free text, 200 chars.';
comment on column public.results.execution is
  'stock = the released runtime, however configured or built. modified = the runtime itself was changed.';
comment on column public.results.mod_source_url is 'Modified only: the fork or repo the changed runtime lives in.';
comment on column public.results.mod_revision is 'Modified only: commit, tag, or build id that produced this number.';

commit;
