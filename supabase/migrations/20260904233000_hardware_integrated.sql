begin;

-- A chip like the Core Ultra 7 265K carries CPU cores, an iGPU, and an NPU, and a model runs at a different speed on
-- each. `integrated` on a CPU row lists the hardware ids of the iGPU and NPU on its package. Those stay rows of their
-- own, so a run on the cores, the iGPU, and the NPU of one chip ranks as three components. Catalog data, like `specs`.
alter table public.hardware add column if not exists integrated text[] not null default '{}'::text[];

insert into public.hardware (id, type, vendor, name, series, specs, release_date, image_url, source, integrated) values
  ('intel-core-ultra-9-285k', 'cpu', 'Intel', 'Core Ultra 9 285K', 'Core Ultra 200S', '{"cores":24,"threads":24,"boostGhz":5.7,"tdpW":125,"platform":"Arrow Lake-S"}'::jsonb, '2024-10-24'::date, null, 'seeded', array['intel-graphics-arrow-lake-s', 'intel-ai-boost-arrow-lake']::text[]),
  ('intel-core-ultra-7-265k', 'cpu', 'Intel', 'Core Ultra 7 265K', 'Core Ultra 200S', '{"cores":20,"threads":20,"boostGhz":5.5,"tdpW":125,"platform":"Arrow Lake-S"}'::jsonb, '2024-10-24'::date, null, 'seeded', array['intel-graphics-arrow-lake-s', 'intel-ai-boost-arrow-lake']::text[]),
  ('intel-core-ultra-5-245k', 'cpu', 'Intel', 'Core Ultra 5 245K', 'Core Ultra 200S', '{"cores":14,"threads":14,"boostGhz":5.2,"tdpW":125,"platform":"Arrow Lake-S"}'::jsonb, '2024-10-24'::date, null, 'seeded', array['intel-graphics-arrow-lake-s', 'intel-ai-boost-arrow-lake']::text[]),
  ('intel-core-ultra-9-288v', 'cpu', 'Intel', 'Core Ultra 9 288V', 'Core Ultra 200V', '{"cores":8,"threads":8,"boostGhz":5.1,"tdpW":30,"platform":"Lunar Lake"}'::jsonb, '2024-09-24'::date, null, 'seeded', array['intel-arc-140v', 'intel-ai-boost-npu-4']::text[]),
  ('intel-core-ultra-7-258v', 'cpu', 'Intel', 'Core Ultra 7 258V', 'Core Ultra 200V', '{"cores":8,"threads":8,"boostGhz":4.8,"tdpW":17,"platform":"Lunar Lake"}'::jsonb, '2024-09-24'::date, null, 'seeded', array['intel-arc-140v', 'intel-ai-boost-npu-4']::text[]),
  ('intel-core-ultra-7-155h', 'cpu', 'Intel', 'Core Ultra 7 155H', 'Core Ultra 100H', '{"cores":16,"threads":22,"boostGhz":4.8,"tdpW":28,"platform":"Meteor Lake"}'::jsonb, '2023-12-14'::date, null, 'seeded', array['intel-arc-graphics-meteor-lake', 'intel-ai-boost-npu-3']::text[]),
  ('intel-core-ultra-x7-358h', 'cpu', 'Intel', 'Core Ultra X7 358H', 'Core Ultra 300', '{"cores":16,"threads":16,"boostGhz":4.8,"tdpW":25,"platform":"Panther Lake"}'::jsonb, '2026-01-05'::date, null, 'seeded', array['intel-arc-b390', 'intel-ai-boost-npu-5']::text[]),
  ('intel-core-i9-14900k', 'cpu', 'Intel', 'Core i9-14900K', 'Core 14th Gen', '{"cores":24,"threads":32,"boostGhz":6,"tdpW":125,"platform":"Raptor Lake Refresh"}'::jsonb, '2023-10-17'::date, null, 'seeded', array['intel-uhd-770']::text[]),
  ('intel-core-i7-14700k', 'cpu', 'Intel', 'Core i7-14700K', 'Core 14th Gen', '{"cores":20,"threads":28,"boostGhz":5.6,"tdpW":125,"platform":"Raptor Lake Refresh"}'::jsonb, '2023-10-17'::date, null, 'seeded', array['intel-uhd-770']::text[]),
  ('intel-xeon-w7-3465x', 'cpu', 'Intel', 'Xeon w7-3465X', 'Xeon W-3400', '{"cores":28,"threads":56,"boostGhz":4.8,"tdpW":300,"platform":"Sapphire Rapids"}'::jsonb, '2023-02-15'::date, null, 'seeded', '{}'::text[]),
  ('intel-xeon-6-6960p', 'cpu', 'Intel', 'Xeon 6 6960P', 'Xeon 6', '{"cores":72,"threads":144,"boostGhz":3.9,"tdpW":500,"platform":"Granite Rapids"}'::jsonb, '2024-09-24'::date, null, 'seeded', '{}'::text[]),
  ('amd-ryzen-9-9950x', 'cpu', 'AMD', 'Ryzen 9 9950X', 'Ryzen 9000', '{"cores":16,"threads":32,"boostGhz":5.7,"tdpW":170,"platform":"Zen 5"}'::jsonb, '2024-08-15'::date, null, 'seeded', '{}'::text[]),
  ('amd-ryzen-7-9800x3d', 'cpu', 'AMD', 'Ryzen 7 9800X3D', 'Ryzen 9000', '{"cores":8,"threads":16,"boostGhz":5.2,"tdpW":120,"platform":"Zen 5"}'::jsonb, '2024-11-07'::date, null, 'seeded', '{}'::text[]),
  ('apple-m4-max', 'cpu', 'Apple', 'M4 Max (16-core)', 'M4', '{"cores":16,"threads":16,"boostGhz":4.5,"tdpW":90,"platform":"Apple silicon"}'::jsonb, '2024-10-30'::date, null, 'seeded', array['apple-m4-max-gpu-40c']::text[]),
  ('intel-arc-pro-b70', 'gpu', 'Intel', 'Arc Pro B70', 'Arc Pro B', '{"vramGb":32,"memoryType":"GDDR6","xeCores":32,"tdpW":240}'::jsonb, '2026-03-10'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-pro-b60', 'gpu', 'Intel', 'Arc Pro B60', 'Arc Pro B', '{"vramGb":24,"memoryType":"GDDR6","xeCores":20,"tdpW":200}'::jsonb, '2025-05-19'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-pro-b50', 'gpu', 'Intel', 'Arc Pro B50', 'Arc Pro B', '{"vramGb":16,"memoryType":"GDDR6","xeCores":16,"tdpW":70}'::jsonb, '2025-05-19'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-b580', 'gpu', 'Intel', 'Arc B580', 'Arc B', '{"vramGb":12,"memoryType":"GDDR6","xeCores":20,"tdpW":190}'::jsonb, '2024-12-13'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-b570', 'gpu', 'Intel', 'Arc B570', 'Arc B', '{"vramGb":10,"memoryType":"GDDR6","xeCores":18,"tdpW":150}'::jsonb, '2025-01-16'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-a770-16gb', 'gpu', 'Intel', 'Arc A770 16GB', 'Arc A', '{"vramGb":16,"memoryType":"GDDR6","xeCores":32,"tdpW":225}'::jsonb, '2022-10-12'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-a750', 'gpu', 'Intel', 'Arc A750', 'Arc A', '{"vramGb":8,"memoryType":"GDDR6","xeCores":28,"tdpW":225}'::jsonb, '2022-10-12'::date, null, 'seeded', '{}'::text[]),
  ('intel-gaudi-3', 'gpu', 'Intel', 'Gaudi 3', 'Gaudi', '{"vramGb":128,"memoryType":"HBM2e","tdpW":900}'::jsonb, '2024-04-09'::date, null, 'seeded', '{}'::text[]),
  ('nvidia-geforce-rtx-5090', 'gpu', 'NVIDIA', 'GeForce RTX 5090', 'GeForce 50', '{"vramGb":32,"memoryType":"GDDR7","tdpW":575}'::jsonb, '2025-01-30'::date, null, 'seeded', '{}'::text[]),
  ('nvidia-geforce-rtx-4090', 'gpu', 'NVIDIA', 'GeForce RTX 4090', 'GeForce 40', '{"vramGb":24,"memoryType":"GDDR6X","tdpW":450}'::jsonb, '2022-10-12'::date, null, 'seeded', '{}'::text[]),
  ('nvidia-geforce-rtx-3090', 'gpu', 'NVIDIA', 'GeForce RTX 3090', 'GeForce 30', '{"vramGb":24,"memoryType":"GDDR6X","tdpW":350}'::jsonb, '2020-09-24'::date, null, 'seeded', '{}'::text[]),
  ('nvidia-rtx-pro-6000-blackwell', 'gpu', 'NVIDIA', 'RTX PRO 6000 Blackwell', 'RTX PRO', '{"vramGb":96,"memoryType":"GDDR7","tdpW":600}'::jsonb, '2025-03-18'::date, null, 'seeded', '{}'::text[]),
  ('amd-radeon-rx-7900-xtx', 'gpu', 'AMD', 'Radeon RX 7900 XTX', 'Radeon 7000', '{"vramGb":24,"memoryType":"GDDR6","tdpW":355}'::jsonb, '2022-12-13'::date, null, 'seeded', '{}'::text[]),
  ('intel-graphics-arrow-lake-s', 'igpu', 'Intel', 'Intel Graphics (Arrow Lake-S)', 'Intel Graphics', '{"xeCores":4,"platform":"Arrow Lake-S","architecture":"Xe-LPG"}'::jsonb, '2024-10-24'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-140v', 'igpu', 'Intel', 'Arc 140V', 'Arc', '{"xeCores":8,"platform":"Lunar Lake","architecture":"Xe2"}'::jsonb, '2024-09-24'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-140t', 'igpu', 'Intel', 'Arc 140T', 'Arc', '{"xeCores":8,"platform":"Arrow Lake-H","architecture":"Xe"}'::jsonb, '2025-01-06'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-graphics-meteor-lake', 'igpu', 'Intel', 'Arc Graphics (Meteor Lake)', 'Arc', '{"xeCores":8,"platform":"Meteor Lake","architecture":"Xe-LPG"}'::jsonb, '2023-12-14'::date, null, 'seeded', '{}'::text[]),
  ('intel-arc-b390', 'igpu', 'Intel', 'Arc B390', 'Arc B', '{"xeCores":12,"platform":"Panther Lake","architecture":"Xe3"}'::jsonb, '2026-01-05'::date, null, 'seeded', '{}'::text[]),
  ('intel-uhd-770', 'igpu', 'Intel', 'UHD Graphics 770', 'UHD', '{"euCount":32,"platform":"Alder / Raptor Lake","architecture":"Xe-LP"}'::jsonb, '2021-11-04'::date, null, 'seeded', '{}'::text[]),
  ('apple-m4-max-gpu-40c', 'igpu', 'Apple', 'M4 Max GPU (40-core)', 'M4', '{"cores":40,"platform":"Apple silicon"}'::jsonb, '2024-10-30'::date, null, 'seeded', '{}'::text[]),
  ('intel-ai-boost-npu-3', 'npu', 'Intel', 'AI Boost NPU (Meteor Lake)', 'AI Boost', '{"tops":11,"platform":"Meteor Lake"}'::jsonb, '2023-12-14'::date, null, 'seeded', '{}'::text[]),
  ('intel-ai-boost-npu-4', 'npu', 'Intel', 'AI Boost NPU 4 (Lunar Lake)', 'AI Boost', '{"tops":48,"platform":"Lunar Lake"}'::jsonb, '2024-09-24'::date, null, 'seeded', '{}'::text[]),
  ('intel-ai-boost-npu-5', 'npu', 'Intel', 'AI Boost NPU 5 (Panther Lake)', 'AI Boost', '{"tops":50,"platform":"Panther Lake"}'::jsonb, '2026-01-05'::date, null, 'seeded', '{}'::text[]),
  ('intel-ai-boost-arrow-lake', 'npu', 'Intel', 'AI Boost NPU (Arrow Lake)', 'AI Boost', '{"tops":13,"platform":"Arrow Lake"}'::jsonb, '2024-10-24'::date, null, 'seeded', '{}'::text[]),
  ('ddr5-5600-32gb', 'ram', 'Generic', 'DDR5-5600 32 GB', null, '{"type":"DDR5","speedMts":5600,"capacityGb":32,"formFactor":"UDIMM"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('ddr5-6000-32gb', 'ram', 'Generic', 'DDR5-6000 32 GB', null, '{"type":"DDR5","speedMts":6000,"capacityGb":32,"formFactor":"UDIMM"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('ddr5-6400-48gb', 'ram', 'Generic', 'DDR5-6400 48 GB', null, '{"type":"DDR5","speedMts":6400,"capacityGb":48,"formFactor":"UDIMM"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('ddr5-4800-64gb-ecc', 'ram', 'Generic', 'DDR5-4800 64 GB ECC RDIMM', null, '{"type":"DDR5","speedMts":4800,"capacityGb":64,"formFactor":"RDIMM"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('ddr5-5600-16gb-sodimm', 'ram', 'Generic', 'DDR5-5600 16 GB SO-DIMM', null, '{"type":"DDR5","speedMts":5600,"capacityGb":16,"formFactor":"SO-DIMM"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('lpddr5x-8533-16gb', 'ram', 'Generic', 'LPDDR5X-8533 16 GB (on package)', null, '{"type":"LPDDR5X","speedMts":8533,"capacityGb":16,"formFactor":"On package"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('lpddr5x-8533-128gb-unified', 'ram', 'Apple', 'Unified memory 128 GB', null, '{"type":"LPDDR5X","speedMts":8533,"capacityGb":128,"formFactor":"On package"}'::jsonb, null, null, 'seeded', '{}'::text[]),
  ('ddr4-3200-32gb', 'ram', 'Generic', 'DDR4-3200 32 GB', null, '{"type":"DDR4","speedMts":3200,"capacityGb":32,"formFactor":"UDIMM"}'::jsonb, null, null, 'seeded', '{}'::text[])
on conflict (id) do update set type = excluded.type, vendor = excluded.vendor, name = excluded.name, series = excluded.series, specs = excluded.specs, release_date = excluded.release_date, image_url = excluded.image_url, source = excluded.source, integrated = excluded.integrated;
commit;
