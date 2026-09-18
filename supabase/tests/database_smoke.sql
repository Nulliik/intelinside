begin;

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
  'text moderation runs in the client',
  '[{"hardware_id":"intel-core-ultra-9-285k","quantity":1}]'::jsonb
);

do $$
begin
  begin
    perform public.create_rig(
      '__invalid_photo_path_must_fail__',
      'test',
      'https://example.com/not-a-storage-object',
      null,
      '[{"hardware_id":"intel-core-ultra-9-285k","quantity":1}]'::jsonb
    );
    raise exception 'unowned rig photo path unexpectedly succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

select public.update_rig(
  (select id from public.rigs where name = '__rls_smoke_rig__'),
  '__rls_smoke_rig__',
  'test-updated',
  null,
  'updated through the authenticated RPC',
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

-- Evidence can be omitted, added from any HTTPS host, and cleared again.
insert into public.results (
  submitter_id, model_id, quant_id, runtime_id, runtime_version, rig_id, decode_tps, run_date
)
select current_setting('test.owner_id')::uuid, 'qwen3-8b', 'int4', 'cascadia', 'optional-evidence-smoke', id, 42, current_date
from public.rigs
where owner_id = current_setting('test.owner_id')::uuid and name = '__rls_smoke_rig__';

update public.results set repo_url = 'https://example.com/benchmark-log'
where runtime_version = 'optional-evidence-smoke';
update public.results set repo_url = null
where runtime_version = 'optional-evidence-smoke';

do $$
begin
  begin
    insert into public.results (
      submitter_id, model_id, quant_id, runtime_id, runtime_version, rig_id,
      component_id, component_quantity, decode_tps, repo_url, run_date
    )
    select
      current_setting('test.owner_id')::uuid, 'qwen3-8b', 'int4', 'cascadia', 'invalid-url-smoke', id,
      'intel-core-ultra-9-285k', 1, 42, 'http://example.com/benchmark-log', current_date
    from public.rigs
    where owner_id = current_setting('test.owner_id')::uuid and name = '__rls_smoke_rig__';
    raise exception 'non-HTTPS evidence URL unexpectedly succeeded';
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
