import type { HardwareItem, HardwareType, Model, Quant, Runtime } from '@/lib/api/types'

// Catalog data. In production this comes from the open catalog repo via the API.

export const RUNTIMES: Runtime[] = [
  { id: 'cascadia', name: 'Cascadia', logoUrl: '/logos/runtimes/cascadia.svg', repoUrl: 'https://github.com/labscommunity/cascadia', color: '#e89960' },
  { id: 'pytorch', name: 'PyTorch', logoUrl: '', repoUrl: 'https://github.com/pytorch/pytorch', color: '#df8db5' },
  { id: 'vllm', name: 'vLLM', logoUrl: '', repoUrl: 'https://github.com/vllm-project/vllm', color: '#dac46d' },
  { id: 'llamacpp', name: 'llama.cpp', logoUrl: '', repoUrl: 'https://github.com/ggml-org/llama.cpp', color: '#9ec773' },
  { id: 'ollama', name: 'Ollama', logoUrl: '', repoUrl: 'https://github.com/ollama/ollama', color: '#b4b7bf' },
  { id: 'openvino-genai', name: 'OpenVINO GenAI', logoUrl: '', repoUrl: 'https://github.com/openvinotoolkit/openvino.genai', color: '#6ab8e4' },
  { id: 'ipex-llm', name: 'IPEX-LLM', logoUrl: '', repoUrl: 'https://github.com/intel/ipex-llm', color: '#64c6ad' },
]

export const QUANTS: Quant[] = [
  { id: 'int4', label: 'INT4', bits: 4, format: 'OpenVINO and IPEX weight-only, used by Cascadia and Intel runtimes' },
  { id: 'int8', label: 'INT8', bits: 8, format: 'OpenVINO / IPEX weight-only' },
  { id: 'fp8', label: 'FP8', bits: 8, format: 'FP8 e4m3' },
  { id: 'fp16', label: 'FP16', bits: 16, format: 'Half precision, the unquantized weights' },
  { id: 'bf16', label: 'BF16', bits: 16, format: 'Brain float' },
  { id: 'q4_k_m', label: 'Q4_K_M', bits: 4, format: 'GGUF, used by llama.cpp and Ollama' },
  { id: 'q4_0', label: 'Q4_0', bits: 4, format: 'GGUF' },
  { id: 'q5_k_m', label: 'Q5_K_M', bits: 5, format: 'GGUF' },
  { id: 'q6_k', label: 'Q6_K', bits: 6, format: 'GGUF' },
  { id: 'q8_0', label: 'Q8_0', bits: 8, format: 'GGUF, used by llama.cpp and Ollama' },
  { id: 'awq-4bit', label: 'AWQ 4-bit', bits: 4, format: 'AWQ' },
  { id: 'gptq-4bit', label: 'GPTQ 4-bit', bits: 4, format: 'GPTQ' },
  { id: 'nf4', label: 'NF4', bits: 4, format: 'bitsandbytes' },
  { id: 'mxfp4', label: 'MXFP4', bits: 4, format: 'Microscaling FP4' },
]

export const MODELS: Model[] = [
  {
    id: 'qwen3-8b', name: 'Qwen3-8B', family: 'Qwen3', params: '8B', architecture: 'dense',
    sourceUrl: 'https://huggingface.co/Qwen/Qwen3-8B', logoUrl: '/logos/models/qwen.svg', brandColor: '#b699eb', quants: ['int4', 'q4_k_m', 'q8_0', 'fp16'],
  },
  {
    id: 'qwen3-30b-a3b', name: 'Qwen3-30B-A3B', family: 'Qwen3', params: '30B', architecture: 'moe', activeParams: '3B',
    sourceUrl: 'https://huggingface.co/Qwen/Qwen3-30B-A3B', logoUrl: '/logos/models/qwen.svg', brandColor: '#b699eb', quants: ['int4', 'q4_k_m', 'q8_0'],
  },
  {
    id: 'llama-3-1-8b', name: 'Llama 3.1 8B Instruct', family: 'Llama 3.1', params: '8B', architecture: 'dense',
    sourceUrl: 'https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct', logoUrl: '/logos/models/llama.svg', brandColor: '#73b0ee', quants: ['int4', 'q4_k_m', 'q8_0', 'fp16'],
  },
  {
    id: 'gemma-3-12b', name: 'Gemma 3 12B IT', family: 'Gemma 3', params: '12B', architecture: 'dense',
    sourceUrl: 'https://huggingface.co/google/gemma-3-12b-it', logoUrl: '/logos/models/gemma.svg', brandColor: '#6dc799', quants: ['int4', 'q4_k_m', 'q8_0'],
  },
]

/** One-line explanation of a quant for tooltips. */
export function quantHint(id: string): string {
  const q = QUANT_BY_ID[id]
  return q ? `${q.bits}-bit · ${q.format}` : id
}

export const HARDWARE_TYPE_LABEL: Record<HardwareType, string> = {
  cpu: 'CPU', gpu: 'GPU', igpu: 'Integrated GPU', npu: 'NPU', ram: 'Memory',
}
export const HARDWARE_TYPES: HardwareType[] = ['cpu', 'gpu', 'igpu', 'npu', 'ram']

const hw = (
  id: string, type: HardwareType, vendor: string, name: string, specs: Record<string, string | number>,
  releaseDate?: string, series?: string,
): HardwareItem => ({ id, type, vendor, name, series, specs, releaseDate, source: 'seeded' })

export const HARDWARE: HardwareItem[] = [
  // Intel CPUs
  hw('intel-core-ultra-9-285k', 'cpu', 'Intel', 'Core Ultra 9 285K', { cores: 24, threads: 24, boostGhz: 5.7, tdpW: 125, platform: 'Arrow Lake-S' }, '2024-10-24', 'Core Ultra 200S'),
  hw('intel-core-ultra-7-265k', 'cpu', 'Intel', 'Core Ultra 7 265K', { cores: 20, threads: 20, boostGhz: 5.5, tdpW: 125, platform: 'Arrow Lake-S' }, '2024-10-24', 'Core Ultra 200S'),
  hw('intel-core-ultra-5-245k', 'cpu', 'Intel', 'Core Ultra 5 245K', { cores: 14, threads: 14, boostGhz: 5.2, tdpW: 125, platform: 'Arrow Lake-S' }, '2024-10-24', 'Core Ultra 200S'),
  hw('intel-core-ultra-9-288v', 'cpu', 'Intel', 'Core Ultra 9 288V', { cores: 8, threads: 8, boostGhz: 5.1, tdpW: 30, platform: 'Lunar Lake' }, '2024-09-24', 'Core Ultra 200V'),
  hw('intel-core-ultra-7-258v', 'cpu', 'Intel', 'Core Ultra 7 258V', { cores: 8, threads: 8, boostGhz: 4.8, tdpW: 17, platform: 'Lunar Lake' }, '2024-09-24', 'Core Ultra 200V'),
  hw('intel-core-ultra-7-155h', 'cpu', 'Intel', 'Core Ultra 7 155H', { cores: 16, threads: 22, boostGhz: 4.8, tdpW: 28, platform: 'Meteor Lake' }, '2023-12-14', 'Core Ultra 100H'),
  hw('intel-core-ultra-x7-358h', 'cpu', 'Intel', 'Core Ultra X7 358H', { cores: 16, threads: 16, boostGhz: 4.8, tdpW: 25, platform: 'Panther Lake' }, '2026-01-05', 'Core Ultra 300'),
  hw('intel-core-i9-14900k', 'cpu', 'Intel', 'Core i9-14900K', { cores: 24, threads: 32, boostGhz: 6.0, tdpW: 125, platform: 'Raptor Lake Refresh' }, '2023-10-17', 'Core 14th Gen'),
  hw('intel-core-i7-14700k', 'cpu', 'Intel', 'Core i7-14700K', { cores: 20, threads: 28, boostGhz: 5.6, tdpW: 125, platform: 'Raptor Lake Refresh' }, '2023-10-17', 'Core 14th Gen'),
  hw('intel-xeon-w7-3465x', 'cpu', 'Intel', 'Xeon w7-3465X', { cores: 28, threads: 56, boostGhz: 4.8, tdpW: 300, platform: 'Sapphire Rapids' }, '2023-02-15', 'Xeon W-3400'),
  hw('intel-xeon-6-6960p', 'cpu', 'Intel', 'Xeon 6 6960P', { cores: 72, threads: 144, boostGhz: 3.9, tdpW: 500, platform: 'Granite Rapids' }, '2024-09-24', 'Xeon 6'),
  // Other CPUs
  hw('amd-ryzen-9-9950x', 'cpu', 'AMD', 'Ryzen 9 9950X', { cores: 16, threads: 32, boostGhz: 5.7, tdpW: 170, platform: 'Zen 5' }, '2024-08-15', 'Ryzen 9000'),
  hw('amd-ryzen-7-9800x3d', 'cpu', 'AMD', 'Ryzen 7 9800X3D', { cores: 8, threads: 16, boostGhz: 5.2, tdpW: 120, platform: 'Zen 5' }, '2024-11-07', 'Ryzen 9000'),
  hw('apple-m4-max', 'cpu', 'Apple', 'M4 Max (16-core)', { cores: 16, threads: 16, boostGhz: 4.5, tdpW: 90, platform: 'Apple silicon' }, '2024-10-30', 'M4'),
  // Intel discrete GPUs
  hw('intel-arc-pro-b70', 'gpu', 'Intel', 'Arc Pro B70', { vramGb: 32, memoryType: 'GDDR6', xeCores: 32, tdpW: 240 }, '2026-03-10', 'Arc Pro B'),
  hw('intel-arc-pro-b60', 'gpu', 'Intel', 'Arc Pro B60', { vramGb: 24, memoryType: 'GDDR6', xeCores: 20, tdpW: 200 }, '2025-05-19', 'Arc Pro B'),
  hw('intel-arc-pro-b50', 'gpu', 'Intel', 'Arc Pro B50', { vramGb: 16, memoryType: 'GDDR6', xeCores: 16, tdpW: 70 }, '2025-05-19', 'Arc Pro B'),
  hw('intel-arc-b580', 'gpu', 'Intel', 'Arc B580', { vramGb: 12, memoryType: 'GDDR6', xeCores: 20, tdpW: 190 }, '2024-12-13', 'Arc B'),
  hw('intel-arc-b570', 'gpu', 'Intel', 'Arc B570', { vramGb: 10, memoryType: 'GDDR6', xeCores: 18, tdpW: 150 }, '2025-01-16', 'Arc B'),
  hw('intel-arc-a770-16gb', 'gpu', 'Intel', 'Arc A770 16GB', { vramGb: 16, memoryType: 'GDDR6', xeCores: 32, tdpW: 225 }, '2022-10-12', 'Arc A'),
  hw('intel-arc-a750', 'gpu', 'Intel', 'Arc A750', { vramGb: 8, memoryType: 'GDDR6', xeCores: 28, tdpW: 225 }, '2022-10-12', 'Arc A'),
  hw('intel-gaudi-3', 'gpu', 'Intel', 'Gaudi 3', { vramGb: 128, memoryType: 'HBM2e', tdpW: 900 }, '2024-04-09', 'Gaudi'),
  // Other GPUs
  hw('nvidia-geforce-rtx-5090', 'gpu', 'NVIDIA', 'GeForce RTX 5090', { vramGb: 32, memoryType: 'GDDR7', tdpW: 575 }, '2025-01-30', 'GeForce 50'),
  hw('nvidia-geforce-rtx-4090', 'gpu', 'NVIDIA', 'GeForce RTX 4090', { vramGb: 24, memoryType: 'GDDR6X', tdpW: 450 }, '2022-10-12', 'GeForce 40'),
  hw('nvidia-geforce-rtx-3090', 'gpu', 'NVIDIA', 'GeForce RTX 3090', { vramGb: 24, memoryType: 'GDDR6X', tdpW: 350 }, '2020-09-24', 'GeForce 30'),
  hw('nvidia-rtx-pro-6000-blackwell', 'gpu', 'NVIDIA', 'RTX PRO 6000 Blackwell', { vramGb: 96, memoryType: 'GDDR7', tdpW: 600 }, '2025-03-18', 'RTX PRO'),
  hw('amd-radeon-rx-7900-xtx', 'gpu', 'AMD', 'Radeon RX 7900 XTX', { vramGb: 24, memoryType: 'GDDR6', tdpW: 355 }, '2022-12-13', 'Radeon 7000'),
  // Integrated GPUs
  hw('intel-arc-140v', 'igpu', 'Intel', 'Arc 140V', { xeCores: 8, platform: 'Lunar Lake', architecture: 'Xe2' }, '2024-09-24', 'Arc'),
  hw('intel-arc-140t', 'igpu', 'Intel', 'Arc 140T', { xeCores: 8, platform: 'Arrow Lake-H', architecture: 'Xe' }, '2025-01-06', 'Arc'),
  hw('intel-arc-graphics-meteor-lake', 'igpu', 'Intel', 'Arc Graphics (Meteor Lake)', { xeCores: 8, platform: 'Meteor Lake', architecture: 'Xe-LPG' }, '2023-12-14', 'Arc'),
  hw('intel-arc-b390', 'igpu', 'Intel', 'Arc B390', { xeCores: 12, platform: 'Panther Lake', architecture: 'Xe3' }, '2026-01-05', 'Arc B'),
  hw('intel-uhd-770', 'igpu', 'Intel', 'UHD Graphics 770', { euCount: 32, platform: 'Alder / Raptor Lake', architecture: 'Xe-LP' }, '2021-11-04', 'UHD'),
  hw('apple-m4-max-gpu-40c', 'igpu', 'Apple', 'M4 Max GPU (40-core)', { cores: 40, platform: 'Apple silicon' }, '2024-10-30', 'M4'),
  // NPUs
  hw('intel-ai-boost-npu-3', 'npu', 'Intel', 'AI Boost NPU (Meteor Lake)', { tops: 11, platform: 'Meteor Lake' }, '2023-12-14', 'AI Boost'),
  hw('intel-ai-boost-npu-4', 'npu', 'Intel', 'AI Boost NPU 4 (Lunar Lake)', { tops: 48, platform: 'Lunar Lake' }, '2024-09-24', 'AI Boost'),
  hw('intel-ai-boost-npu-5', 'npu', 'Intel', 'AI Boost NPU 5 (Panther Lake)', { tops: 50, platform: 'Panther Lake' }, '2026-01-05', 'AI Boost'),
  hw('intel-ai-boost-arrow-lake', 'npu', 'Intel', 'AI Boost NPU (Arrow Lake)', { tops: 13, platform: 'Arrow Lake' }, '2024-10-24', 'AI Boost'),
  // Memory (one item = one module; the rig quantity gives total capacity)
  hw('ddr5-5600-32gb', 'ram', 'Generic', 'DDR5-5600 32 GB', { type: 'DDR5', speedMts: 5600, capacityGb: 32, formFactor: 'UDIMM' }),
  hw('ddr5-6000-32gb', 'ram', 'Generic', 'DDR5-6000 32 GB', { type: 'DDR5', speedMts: 6000, capacityGb: 32, formFactor: 'UDIMM' }),
  hw('ddr5-6400-48gb', 'ram', 'Generic', 'DDR5-6400 48 GB', { type: 'DDR5', speedMts: 6400, capacityGb: 48, formFactor: 'UDIMM' }),
  hw('ddr5-4800-64gb-ecc', 'ram', 'Generic', 'DDR5-4800 64 GB ECC RDIMM', { type: 'DDR5', speedMts: 4800, capacityGb: 64, formFactor: 'RDIMM' }),
  hw('ddr5-5600-16gb-sodimm', 'ram', 'Generic', 'DDR5-5600 16 GB SO-DIMM', { type: 'DDR5', speedMts: 5600, capacityGb: 16, formFactor: 'SO-DIMM' }),
  hw('lpddr5x-8533-16gb', 'ram', 'Generic', 'LPDDR5X-8533 16 GB (on package)', { type: 'LPDDR5X', speedMts: 8533, capacityGb: 16, formFactor: 'On package' }),
  hw('lpddr5x-8533-128gb-unified', 'ram', 'Apple', 'Unified memory 128 GB', { type: 'LPDDR5X', speedMts: 8533, capacityGb: 128, formFactor: 'On package' }),
  hw('ddr4-3200-32gb', 'ram', 'Generic', 'DDR4-3200 32 GB', { type: 'DDR4', speedMts: 3200, capacityGb: 32, formFactor: 'UDIMM' }),
]

export const HARDWARE_BY_ID: Record<string, HardwareItem> = Object.fromEntries(HARDWARE.map((h) => [h.id, h]))
/** Hardware currently exposed in browsing and rig-building UIs. */
export const VISIBLE_HARDWARE = HARDWARE.filter((h) => h.vendor === 'Intel' || h.vendor === 'Generic')
export const RUNTIME_BY_ID: Record<string, Runtime> = Object.fromEntries(RUNTIMES.map((r) => [r.id, r]))
export const MODEL_BY_ID: Record<string, Model> = Object.fromEntries(MODELS.map((m) => [m.id, m]))
export const QUANT_BY_ID: Record<string, Quant> = Object.fromEntries(QUANTS.map((q) => [q.id, q]))
export const VENDORS = Array.from(new Set(VISIBLE_HARDWARE.map((h) => h.vendor))).filter((v) => v !== 'Generic')
