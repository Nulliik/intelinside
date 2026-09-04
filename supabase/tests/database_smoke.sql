begin;

do $$
begin
  if 'https://example.com/not-github' ~* '^https://(www[.])?github[.]com(/|$)'
    or not ('https://github.com/labscommunity/intelinside' ~* '^https://(www[.])?github[.]com(/|$)') then
    raise exception 'GitHub URL constraint pattern is incorrect';
  end if;
end;
$$;

select set_config('test.owner_id', (select id::text from public.profiles order by created_at limit 1), true);

do $$
begin
  if current_setting('test.owner_id', true) is null then
    raise exception 'database smoke test requires one authenticated profile';
  end if;
end;
$$;

insert into public.profiles (id, handle, name)
values ('00000000-0000-0000-0000-000000000002', 'rls-smoke-reviewer', 'RLS smoke reviewer');

set local role anon;

do $$
begin
  if (select count(*) from public.models) < 1 then
    raise exception 'anonymous catalog read failed';
  end if;

  begin
    insert into public.rigs (owner_id, name, os)
    values (current_setting('test.owner_id')::uuid, '__anon_write_must_fail__', 'test');
    raise exception 'anonymous rig insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('test.owner_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select public.create_rig(
  '__rls_smoke_rig__',
  'test',
  null,
  'created through the transactional RPC',
  '[{"hardware_id":"intel-core-ultra-9-285k","quantity":1}]'::jsonb
);

insert into public.results (
  submitter_id, model_id, quant_id, runtime_id, runtime_version, rig_id,
  component_id, component_quantity, decode_tps, repo_url, run_date
)
select
  current_setting('test.owner_id')::uuid, 'qwen3-8b', 'int4', 'cascadia', 'smoke', id,
  'intel-core-ultra-9-285k', 1, 42, 'https://github.com/labscommunity/cascadia', current_date
from public.rigs
where owner_id = current_setting('test.owner_id')::uuid and name = '__rls_smoke_rig__';

do $$
begin
  begin
    insert into public.results (
      submitter_id, model_id, quant_id, runtime_id, runtime_version, rig_id,
      component_id, component_quantity, decode_tps, repo_url, run_date
    )
    select
      current_setting('test.owner_id')::uuid, 'qwen3-8b', 'int4', 'cascadia', 'invalid-url-smoke', id,
      'intel-core-ultra-9-285k', 1, 42, 'https://example.com/not-github', current_date
    from public.rigs
    where owner_id = current_setting('test.owner_id')::uuid and name = '__rls_smoke_rig__';
    raise exception 'non-GitHub result URL unexpectedly succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
set local role authenticated;

insert into public.result_confirmations (result_id, user_id)
select id, '00000000-0000-0000-0000-000000000002'
from public.results
where repo_url = 'https://github.com/labscommunity/cascadia' and runtime_version = 'smoke';

insert into public.result_flags (result_id, user_id, reason)
select id, '00000000-0000-0000-0000-000000000002', 'other'
from public.results
where repo_url = 'https://github.com/labscommunity/cascadia' and runtime_version = 'smoke';

do $$
begin
  if not exists (
    select 1 from public.results
    where runtime_version = 'smoke' and confirmations_count = 1 and flags_count = 1
  ) then
    raise exception 'result counters did not update';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
set local role authenticated;

do $$
declare
  affected integer;
begin
  update public.rigs set name = '__stolen__' where name = '__rls_smoke_rig__';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'non-owner update unexpectedly succeeded';
  end if;
end;
$$;

rollback;
