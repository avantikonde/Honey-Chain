/**
 * Honey Chain domain logic — pure, framework-free helpers.
 *
 * Everything here is 100% software: the "IoT" layer is a virtual simulator,
 * the "AI" layer is explainable rule + statistics based anomaly detection,
 * and the blockchain layer is an abstraction that runs in clearly labelled
 * SIMULATION mode until real testnet credentials are configured.
 */

export type HiveStatus = "healthy" | "attention" | "critical";
export type SimulationScenario = "normal" | "stress" | "heat" | "humidity";

export interface SensorSample {
  temperature: number;
  humidity: number;
  weight_kg: number;
  activity_pct: number;
  acoustic_index: number;
}

export interface HiveRecord extends SensorSample {
  id: string;
  code: string;
  apiary_id: string;
  location: string | null;
  health_score: number;
  status: string;
  updated_at: string;
  is_demo: boolean;
}

/* ------------------------------------------------------------------ */
/* Virtual IoT simulator                                               */
/* ------------------------------------------------------------------ */

const IDEAL = {
  temperature: 34.5,
  humidity: 58,
  activity_pct: 88,
  acoustic_index: 64,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, d = 1) => Number(v.toFixed(d));

/** Target values each scenario drifts towards. */
const SCENARIO_TARGETS: Record<SimulationScenario, SensorSample> = {
  normal: { temperature: 34.5, humidity: 58, weight_kg: 0, activity_pct: 88, acoustic_index: 64 },
  stress: { temperature: 41.2, humidity: 82, weight_kg: 0, activity_pct: 48, acoustic_index: 91 },
  heat: { temperature: 40.1, humidity: 46, weight_kg: 0, activity_pct: 62, acoustic_index: 78 },
  humidity: { temperature: 35.4, humidity: 88, weight_kg: 0, activity_pct: 66, acoustic_index: 72 },
};

/** Weight trend per tick (kg). Healthy hives gain, stressed hives lose. */
const WEIGHT_TREND: Record<SimulationScenario, number> = {
  normal: 0.045,
  stress: -0.09,
  heat: -0.05,
  humidity: -0.03,
};

/**
 * Produce the next virtual reading. Values ease towards the scenario target
 * with a small amount of noise, so charts look like real telemetry.
 */
export function nextReading(prev: SensorSample, scenario: SimulationScenario): SensorSample {
  const target = SCENARIO_TARGETS[scenario];
  const ease = (from: number, to: number, rate: number, noise: number) =>
    from + (to - from) * rate + (Math.random() - 0.5) * noise;

  return {
    temperature: round(clamp(ease(prev.temperature, target.temperature, 0.28, 0.3), 20, 48), 1),
    humidity: Math.round(clamp(ease(prev.humidity, target.humidity, 0.26, 1.6), 20, 98)),
    weight_kg: round(clamp(prev.weight_kg + WEIGHT_TREND[scenario] + (Math.random() - 0.5) * 0.05, 5, 120), 2),
    activity_pct: Math.round(clamp(ease(prev.activity_pct, target.activity_pct, 0.26, 2.5), 0, 100)),
    acoustic_index: Math.round(clamp(ease(prev.acoustic_index, target.acoustic_index, 0.24, 2), 0, 120)),
  };
}

/* ------------------------------------------------------------------ */
/* AI-assisted colony health analysis (explainable, rule + z-score)     */
/* ------------------------------------------------------------------ */

export interface AnalysisFactor {
  label: string;
  detail: string;
  severity: "ok" | "warn" | "high";
  contribution: number;
}

export interface HiveAnalysis {
  riskScore: number;
  healthScore: number;
  status: HiveStatus;
  title: string;
  recommendation: string;
  factors: AnalysisFactor[];
}

const STATUS_LABEL: Record<HiveStatus, string> = {
  healthy: "Healthy",
  attention: "Attention Required",
  critical: "Critical",
};

export const statusLabel = (s: string) => STATUS_LABEL[s as HiveStatus] ?? s;

/**
 * Deviation-based anomaly detection. Each signal contributes a bounded amount
 * of risk; the total is normalised to 0-100. Fully explainable — every factor
 * is returned with the reason it fired.
 *
 * This is AI-assisted decision support, not a validated veterinary diagnosis.
 */
export function analyseHive(sample: SensorSample, weightTrend = 0): HiveAnalysis {
  const factors: AnalysisFactor[] = [];
  let risk = 0;

  const tempDev = Math.abs(sample.temperature - IDEAL.temperature);
  const tempRisk = clamp((tempDev - 1.5) / 6, 0, 1) * 32;
  factors.push({
    label: "Brood temperature",
    detail: `${sample.temperature.toFixed(1)}°C vs ideal ${IDEAL.temperature}°C`,
    severity: tempRisk > 20 ? "high" : tempRisk > 8 ? "warn" : "ok",
    contribution: Math.round(tempRisk),
  });
  risk += tempRisk;

  const humDev = Math.abs(sample.humidity - IDEAL.humidity);
  const humRisk = clamp((humDev - 6) / 26, 0, 1) * 24;
  factors.push({
    label: "In-hive humidity",
    detail: `${Math.round(sample.humidity)}% vs ideal ${IDEAL.humidity}%`,
    severity: humRisk > 15 ? "high" : humRisk > 6 ? "warn" : "ok",
    contribution: Math.round(humRisk),
  });
  risk += humRisk;

  const actRisk = clamp((IDEAL.activity_pct - sample.activity_pct) / 55, 0, 1) * 26;
  factors.push({
    label: "Foraging activity",
    detail: `${Math.round(sample.activity_pct)}% of baseline entrance traffic`,
    severity: actRisk > 16 ? "high" : actRisk > 7 ? "warn" : "ok",
    contribution: Math.round(actRisk),
  });
  risk += actRisk;

  const weightRisk = weightTrend < 0 ? clamp(-weightTrend / 1.2, 0, 1) * 12 : 0;
  factors.push({
    label: "Hive weight trend",
    detail:
      weightTrend >= 0
        ? `+${weightTrend.toFixed(2)} kg over recent window`
        : `${weightTrend.toFixed(2)} kg over recent window`,
    severity: weightRisk > 8 ? "high" : weightRisk > 3 ? "warn" : "ok",
    contribution: Math.round(weightRisk),
  });
  risk += weightRisk;

  const acousticRisk = clamp((sample.acoustic_index - 78) / 32, 0, 1) * 6;
  factors.push({
    label: "Acoustic index",
    detail: `${Math.round(sample.acoustic_index)} — colony sound intensity`,
    severity: acousticRisk > 4 ? "warn" : "ok",
    contribution: Math.round(acousticRisk),
  });
  risk += acousticRisk;

  const riskScore = Math.round(clamp(risk, 0, 100));
  const status: HiveStatus = riskScore >= 70 ? "critical" : riskScore >= 40 ? "attention" : "healthy";
  const healthScore = Math.round(clamp(100 - riskScore * 0.92, 0, 100));

  const title =
    status === "critical"
      ? "Possible colony stress detected"
      : status === "attention"
        ? "Early deviation from baseline"
        : "Colony operating within normal range";

  const recommendation =
    status === "critical"
      ? "Inspect the hive within the next 24 hours: check ventilation, water availability, queen presence and signs of robbing."
      : status === "attention"
        ? "Re-inspect within 48 hours and improve ventilation or shading if the trend continues."
        : "No action needed. Continue routine weekly inspection.";

  return { riskScore, healthScore, status, title, recommendation, factors };
}

/* ------------------------------------------------------------------ */
/* Productivity prediction (explainable linear projection)              */
/* ------------------------------------------------------------------ */

export interface WeightPoint {
  t: number; // hours since first sample
  weight: number;
}

export interface ProductivityPrediction {
  currentWeight: number;
  dailyGain: number;
  predictedHarvestKg: number;
  windowStart: Date;
  windowEnd: Date;
  confidence: number;
  projection: { label: string; weight: number | null; projected: number | null }[];
}

/** Ordinary least-squares fit over hive weight, projected forward. */
export function predictProductivity(
  history: WeightPoint[],
  healthScore: number,
): ProductivityPrediction | null {
  if (history.length < 4) return null;

  const n = history.length;
  const meanT = history.reduce((s, p) => s + p.t, 0) / n;
  const meanW = history.reduce((s, p) => s + p.weight, 0) / n;
  const num = history.reduce((s, p) => s + (p.t - meanT) * (p.weight - meanW), 0);
  const den = history.reduce((s, p) => s + (p.t - meanT) ** 2, 0) || 1;
  const slope = num / den; // kg per hour
  const intercept = meanW - slope * meanT;

  // R² for confidence
  const ssTot = history.reduce((s, p) => s + (p.weight - meanW) ** 2, 0) || 1;
  const ssRes = history.reduce((s, p) => s + (p.weight - (intercept + slope * p.t)) ** 2, 0);
  const r2 = clamp(1 - ssRes / ssTot, 0, 1);

  const current = history[history.length - 1]!.weight;
  const dailyGain = slope * 24;
  const daysToHarvest = clamp(dailyGain > 0.02 ? 5 + 12 * (1 - r2) : 21, 5, 30);

  const surplus = Math.max(0, current - 28) * 0.55 + Math.max(0, dailyGain) * daysToHarvest * 0.7;
  const predictedHarvestKg = round(clamp(surplus * (0.6 + healthScore / 250), 0.5, 60), 1);

  const windowStart = new Date(Date.now() + daysToHarvest * 864e5);
  const windowEnd = new Date(Date.now() + (daysToHarvest + 5) * 864e5);
  const confidence = Math.round(clamp(45 + r2 * 45 + healthScore * 0.12, 25, 96));

  const lastT = history[n - 1]!.t;
  const projection: ProductivityPrediction["projection"] = history
    .slice(-24)
    .map((p) => ({ label: `${Math.round((p.t - lastT) / 24)}d`, weight: round(p.weight, 2), projected: null }));
  projection.push({
    label: "now",
    weight: round(current, 2),
    projected: round(current, 2),
  });
  for (let d = 1; d <= Math.round(daysToHarvest); d += Math.max(1, Math.round(daysToHarvest / 6))) {
    projection.push({
      label: `+${d}d`,
      weight: null,
      projected: round(current + dailyGain * d, 2),
    });
  }

  return {
    currentWeight: round(current, 1),
    dailyGain: round(dailyGain, 2),
    predictedHarvestKg,
    windowStart,
    windowEnd,
    confidence,
    projection,
  };
}

/* ------------------------------------------------------------------ */
/* Blockchain abstraction                                              */
/* ------------------------------------------------------------------ */

export type ChainMode = "simulated" | "testnet";

/**
 * Real testnet writes require an EVM RPC endpoint + contract address.
 * Until those are configured the service runs in clearly labelled
 * SIMULATION MODE — records are cryptographic hashes stored off-chain and
 * are never presented as real on-chain transactions.
 */
export function chainMode(): ChainMode {
  const rpc = (import.meta.env["VITE_EVM_RPC_URL"] as string | undefined) ?? "";
  const contract = (import.meta.env["VITE_HONEYCHAIN_CONTRACT"] as string | undefined) ?? "";
  return rpc && contract ? "testnet" : "simulated";
}

export const CHAIN_NETWORK = chainMode() === "testnet" ? "evm-testnet" : "simulated-evm";

/** SHA-256 hex digest of the canonical JSON payload (Web Crypto). */
export async function sha256Hex(payload: unknown): Promise<string> {
  const text = typeof payload === "string" ? payload : canonicalJson(payload);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Stable key ordering so the same event always hashes identically. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

export interface ChainReceipt {
  data_hash: string;
  tx_hash: string;
  block_number: number;
  network: string;
  mode: ChainMode;
}

/**
 * Anchor a traceability proof. ON-CHAIN payload is intentionally minimal:
 * batch id, event type, timestamp and the data hash. Everything else
 * (users, sensor data, images, analytics) stays OFF-CHAIN in the database.
 */
export async function anchorProof(proof: {
  batch_code: string;
  event_type: string;
  actor: string;
  occurred_at: string;
  payload: unknown;
}): Promise<ChainReceipt> {
  const data_hash = await sha256Hex(proof.payload);
  const mode = chainMode();

  if (mode === "testnet") {
    // Real integration point: submit `data_hash` to the HoneyChain registry
    // contract and return the on-chain receipt. Deliberately not faked here.
    throw new Error(
      "Testnet mode is configured but no signer is wired yet. Remove VITE_EVM_RPC_URL to use simulation mode.",
    );
  }

  const tx_hash = `0x${await sha256Hex(`${data_hash}:${proof.occurred_at}:${proof.event_type}`)}`;
  const block_number = 8_420_000 + (parseInt(data_hash.slice(0, 6), 16) % 90_000);
  return { data_hash, tx_hash, block_number, network: CHAIN_NETWORK, mode };
}

/* ------------------------------------------------------------------ */
/* Traceability lifecycle                                              */
/* ------------------------------------------------------------------ */

export const LIFECYCLE = [
  { key: "harvest", label: "Harvest", actorHint: "Beekeeper" },
  { key: "extraction", label: "Extraction", actorHint: "Beekeeper" },
  { key: "processing", label: "Processing", actorHint: "Processing unit" },
  { key: "quality_check", label: "Quality Check", actorHint: "Certified lab" },
  { key: "packaging", label: "Packaging", actorHint: "Processing unit" },
  { key: "distribution", label: "Distribution", actorHint: "Distributor" },
  { key: "retail", label: "Consumer", actorHint: "Retail / consumer" },
] as const;

export type LifecycleKey = (typeof LIFECYCLE)[number]["key"];

export const eventLabel = (key: string) =>
  LIFECYCLE.find((s) => s.key === key)?.label ?? key.replace(/_/g, " ");

export function generateBatchCode(sequence: number): string {
  const year = new Date().getFullYear();
  return `HC-${year}-${String(sequence).padStart(5, "0")}`;
}

export const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
