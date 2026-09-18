begin;

-- Keep PR #31's catalog entries and model/quant boards in sync with the frontend.
insert into public.quants (id, label, bits, format) values
  ('q4_k_xl', 'Q4_K_XL', 4, 'GGUF, Unsloth Dynamic Q4_K_XL')
on conflict (id) do update set label = excluded.label, bits = excluded.bits, format = excluded.format;

insert into public.models (id, name, family, params, architecture, active_params, source_url, logo_url, brand_color) values
  ('muse-glimmer-30b', 'Muse Glimmer 30B', 'Muse', '30B', 'dense', null, 'https://huggingface.co/facebook/Muse-Glimmer-30B', '/logos/models/llama.svg', '#73b0ee'),
  ('nemotron-3-5-lightning-30b-a3b', 'Nemotron 3.5 Lightning 30B A3B', 'Nemotron 3.5', '30B', 'moe', '3B', 'https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16', '/logos/models/nemotron.svg', '#8fc25c')
on conflict (id) do update set name = excluded.name, family = excluded.family, params = excluded.params, architecture = excluded.architecture, active_params = excluded.active_params, source_url = excluded.source_url, logo_url = excluded.logo_url, brand_color = excluded.brand_color;

insert into public.model_quants (model_id, quant_id) values
  ('muse-glimmer-30b', 'q4_k_xl'),
  ('nemotron-3-5-lightning-30b-a3b', 'gptq-4bit')
on conflict (model_id, quant_id) do nothing;

commit;
