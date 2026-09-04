import { createServer } from 'vite'

const quote = (value) => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`
const json = (value) => `${quote(JSON.stringify(value))}::jsonb`
const row = (values) => `  (${values.join(', ')})`

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const { HARDWARE, MODELS, QUANTS, RUNTIMES } = await server.ssrLoadModule('/src/mocks/catalog.ts')
  const statements = [
    'begin;',
    '',
    'insert into public.quants (id, label, bits, format) values',
    QUANTS.map((item) => row([quote(item.id), quote(item.label), item.bits, quote(item.format)])).join(',\n'),
    'on conflict (id) do update set label = excluded.label, bits = excluded.bits, format = excluded.format;',
    '',
    'insert into public.models (id, name, family, params, architecture, active_params, source_url, logo_url, brand_color) values',
    MODELS.map((item) => row([
      quote(item.id), quote(item.name), quote(item.family), quote(item.params), quote(item.architecture),
      quote(item.activeParams), quote(item.sourceUrl), quote(item.logoUrl), quote(item.brandColor),
    ])).join(',\n'),
    'on conflict (id) do update set name = excluded.name, family = excluded.family, params = excluded.params, architecture = excluded.architecture, active_params = excluded.active_params, source_url = excluded.source_url, logo_url = excluded.logo_url, brand_color = excluded.brand_color;',
    '',
    'insert into public.model_quants (model_id, quant_id) values',
    MODELS.flatMap((model) => model.quants.map((quant) => row([quote(model.id), quote(quant)]))).join(',\n'),
    'on conflict (model_id, quant_id) do nothing;',
    '',
    'insert into public.runtimes (id, name, logo_url, repo_url, color) values',
    RUNTIMES.map((item) => row([quote(item.id), quote(item.name), quote(item.logoUrl), quote(item.repoUrl), quote(item.color)])).join(',\n'),
    'on conflict (id) do update set name = excluded.name, logo_url = excluded.logo_url, repo_url = excluded.repo_url, color = excluded.color;',
    '',
    'insert into public.hardware (id, type, vendor, name, series, specs, release_date, image_url, source) values',
    HARDWARE.map((item) => row([
      quote(item.id), quote(item.type), quote(item.vendor), quote(item.name), quote(item.series), json(item.specs),
      item.releaseDate ? `${quote(item.releaseDate)}::date` : 'null', quote(item.imageUrl), quote(item.source),
    ])).join(',\n'),
    'on conflict (id) do update set type = excluded.type, vendor = excluded.vendor, name = excluded.name, series = excluded.series, specs = excluded.specs, release_date = excluded.release_date, image_url = excluded.image_url, source = excluded.source;',
    '',
    'commit;',
    '',
  ]

  process.stdout.write(statements.join('\n'))
} finally {
  await server.close()
}
