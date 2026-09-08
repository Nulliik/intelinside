begin;

-- Private receipts survive result deletion, preventing retries from resurrecting deleted runs.
create table private.pr_result_imports (
  repository text not null,
  path text not null,
  pr_number bigint not null,
  github_id text not null,
  payload jsonb not null,
  result_id bigint references public.results(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (repository, path)
);
revoke all on private.pr_result_imports from public, anon, authenticated;

-- Only trusted CI may assert a GitHub identity. Never expose this RPC to browser roles.
-- Dry runs execute the same inserts/constraints in a subtransaction, then roll it back.
create function public.ingest_pr_results(
  p_repository text, p_pr_number bigint, p_github_id text,
  p_files jsonb, p_dry_run boolean default true
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  owner_uuid uuid;
  item jsonb;
  f jsonb;
  receipt private.pr_result_imports%rowtype;
  rig bigint;
  build bigint;
  matches integer;
  result_id bigint;
  answer jsonb := '[]'::jsonb;
  evidence text;
begin
  if p_repository is distinct from 'labscommunity/intelinside'
    or p_pr_number is null or p_pr_number <= 0
    or p_github_id is null or p_github_id !~ '^[0-9]+$'
    or p_dry_run is null then
    raise exception 'Invalid PR provenance';
  end if;
  if jsonb_typeof(p_files) is distinct from 'array' or jsonb_array_length(p_files) not between 1 and 100 then
    raise exception 'Submit between 1 and 100 result files';
  end if;

  select p.id into owner_uuid
  from auth.identities i join public.profiles p on p.auth_user_id = i.user_id
  where i.provider = 'github' and i.provider_id = p_github_id;
  if owner_uuid is null then
    raise exception 'No site account is linked to the PR author. Sign up on the site with the same GitHub account, then rerun this check.';
  end if;
  evidence := 'https://github.com/' || p_repository || '/pull/' || p_pr_number;
  -- Serialize imports of a repository, including simultaneous retries of the same PR.
  perform pg_advisory_xact_lock(hashtextextended('pr-results:' || p_repository, 0));
  begin
    for item in select value from jsonb_array_elements(p_files) loop
      f := item -> 'file';
      if (item ->> 'path') is null or (item ->> 'path') !~ '^results/[^/]+/[^/]+[.]json$'
        or jsonb_typeof(f) is distinct from 'object' then
        raise exception 'Invalid result file';
      end if;
      -- Exports of already-live results are archives, never an instruction to insert/update.
      if nullif(f ->> 'result', '') is not null then
        answer := answer || jsonb_build_array(jsonb_build_object('path', item ->> 'path', 'status', 'archive'));
        continue;
      end if;
      select * into receipt from private.pr_result_imports
      where repository = p_repository and path = item ->> 'path';
      if found then
        if receipt.pr_number <> p_pr_number or receipt.github_id <> p_github_id or receipt.payload <> f then
          raise exception 'File % was already imported. Edit the live result on the site; use a new filename for a new run.', item ->> 'path';
        end if;
        answer := answer || jsonb_build_array(jsonb_build_object('path', item ->> 'path', 'status', 'already_imported', 'id', receipt.result_id::text));
        continue;
      end if;

      select count(*), min(id) into matches, rig from public.rigs
      where owner_id = owner_uuid and
        (case when f ->> 'rig' ~ '^[0-9]+$' then id::text = f ->> 'rig' else name = f ->> 'rig' end);
      if matches <> 1 then
        raise exception 'File %: rig must identify exactly one rig owned by the PR author. Register the rig first or use its numeric ID.', item ->> 'path';
      end if;
      build := null;
      if nullif(f ->> 'customRuntime', '') is not null then
        select count(*), min(id) into matches, build from public.custom_runtimes
        where runtime_id = f ->> 'runtime' and
          (case when f ->> 'customRuntime' ~ '^[0-9]+$' then id::text = f ->> 'customRuntime' else name = f ->> 'customRuntime' end);
        if matches <> 1 then
          raise exception 'File %: customRuntime must identify exactly one registered build of the selected runtime; use its numeric ID.', item ->> 'path';
        end if;
      end if;
      if length(coalesce(f ->> 'notes', '')) > 5000 then
        raise exception 'Notes must be 5000 characters or fewer';
      end if;
      -- A previous submission through the legacy prefill form must not be imported again.
      if exists (select 1 from public.results r where r.repo_url = evidence
        and not exists (select 1 from private.pr_result_imports i where i.result_id = r.id)) then
        raise exception 'This PR already has a result submitted through the site. Add its result URL to the JSON to archive it without creating a duplicate.';
      end if;
      insert into public.results (
        submitter_id, rig_id, component_id, component_quantity, model_id, quant_id,
        runtime_id, runtime_version, runtime_flags, custom_runtime_id, revision,
        decode_tps, prompt_tps, ttft_ms, context_length, batch_size, run_date, notes, repo_url
      ) values (
        owner_uuid, rig, f ->> 'component',
        case when f ->> 'component' is not null then coalesce((f ->> 'componentQuantity')::smallint, 1) end,
        f ->> 'model', f ->> 'quant', f ->> 'runtime', f ->> 'runtimeVersion',
        f ->> 'runtimeFlags', build, f ->> 'revision',
        (f ->> 'decodeTps')::numeric, (f ->> 'promptTps')::numeric, (f ->> 'ttftMs')::numeric,
        (f ->> 'contextLength')::integer, (f ->> 'batchSize')::integer,
        (f ->> 'runDate')::date, f ->> 'notes', evidence
      ) returning id into result_id;
      insert into private.pr_result_imports(repository, path, pr_number, github_id, payload, result_id)
      values (p_repository, item ->> 'path', p_pr_number, p_github_id, f, result_id);
      answer := answer || jsonb_build_array(jsonb_build_object('path', item ->> 'path',
        'status', case when p_dry_run then 'validated' else 'imported' end,
        'id', case when p_dry_run then null else result_id::text end));
    end loop;
    if p_dry_run then raise exception using errcode = 'PT001', message = 'Rollback validation'; end if;
  exception when sqlstate 'PT001' then null;
  end;
  return answer;
end;
$$;
revoke all on function public.ingest_pr_results(text, bigint, text, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.ingest_pr_results(text, bigint, text, jsonb, boolean) to service_role;

commit;
