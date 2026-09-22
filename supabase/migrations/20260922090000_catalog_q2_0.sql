begin;

-- Keep the Q2_0 quant and Qwen3.8-Flash-Next board in sync with the frontend catalog.
insert into public.quants (id, label, bits, format) values
  ('q2_0', 'Q2_0', 2, 'GGUF')
on conflict (id) do update set label = excluded.label, bits = excluded.bits, format = excluded.format;

insert into public.model_quants (model_id, quant_id) values
  ('qwen3-8-flash-next', 'q2_0')
on conflict (model_id, quant_id) do nothing;

commit;
