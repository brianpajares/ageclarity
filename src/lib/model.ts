import { z } from "zod";

const measurement = <const T extends readonly [string, ...string[]]>(
  units: T
) =>
  z
    .object({
      value: z.number().finite().positive(),
      unit: z.enum(units)
    })
    .strict();

export const calculationInputSchema = z
  .object({
    age: z.number().finite().min(20).max(84),
    chemistry: z
      .object({
        albumin: measurement(["g/L", "g/dL"]),
        creatinine: measurement(["umol/L", "mg/dL"]),
        glucose: measurement(["mmol/L", "mg/dL"]),
        alp: measurement(["U/L"])
      })
      .strict(),
    inflammation: z
      .object({
        crp: measurement(["mg/dL", "mg/L"])
      })
      .strict(),
    cbc: z
      .object({
        lymphocyte_pct: z.number().finite().min(0).max(100),
        mcv: measurement(["fL"]),
        rdw: measurement(["%"]),
        wbc: measurement(["10^3/uL", "10^9/L"])
      })
      .strict(),
    country: z.enum(["MX", "ES", "BR", "CO", "PE", "AR"]).optional()
  })
  .strict();

export type CalculationInput = z.infer<typeof calculationInputSchema>;

export type NormalizedInputs = {
  age_years: number;
  albumin_gL: number;
  creatinine_umolL: number;
  glucose_mmolL: number;
  crp_mg_dL: number;
  lymphocyte_pct: number;
  mcv_fL: number;
  rdw_pct: number;
  alp_UL: number;
  wbc_10e3uL: number;
};

const parameters = {
  intercept: -19.90667,
  beta_albumin: -0.03359355,
  beta_creatinine: 0.009506491,
  beta_glucose: 0.1953192,
  beta_ln_crp: 0.09536762,
  beta_lymphocyte: -0.01199984,
  beta_mcv: 0.02676401,
  beta_rdw: 0.3306156,
  beta_alp: 0.001868778,
  beta_wbc: 0.05542406,
  beta_age: 0.08035356,
  gompertz_num: -1.51714,
  gompertz_den: 0.007692696,
  age_transform_scale: -0.0055305,
  age_transform_den: 0.090165,
  age_transform_intercept: 141.50225,
  historical_alt_den: 0.09165
} as const;

const unitValues: Record<string, number> = {
  albumin_gL: 1,
  albumin_gdL: 10,
  creatinine_umolL: 1,
  creatinine_mgdL: 88.4,
  glucose_mmolL: 1,
  glucose_mgdL: 0.05551,
  crp_mgdL: 1,
  crp_mgL: 0.1,
  wbc_10e3uL: 1,
  wbc_10e9L: 1
};

export function normalizeInputs(input: CalculationInput): NormalizedInputs {
  const data = calculationInputSchema.parse(input);
  return {
    age_years: data.age,
    albumin_gL:
      data.chemistry.albumin.value *
      unitValues[
        data.chemistry.albumin.unit === "g/L" ? "albumin_gL" : "albumin_gdL"
      ],
    creatinine_umolL:
      data.chemistry.creatinine.value *
      unitValues[
        data.chemistry.creatinine.unit === "umol/L"
          ? "creatinine_umolL"
          : "creatinine_mgdL"
      ],
    glucose_mmolL:
      data.chemistry.glucose.value *
      unitValues[
        data.chemistry.glucose.unit === "mmol/L"
          ? "glucose_mmolL"
          : "glucose_mgdL"
      ],
    crp_mg_dL:
      data.inflammation.crp.value *
      unitValues[
        data.inflammation.crp.unit === "mg/dL" ? "crp_mgdL" : "crp_mgL"
      ],
    lymphocyte_pct: data.cbc.lymphocyte_pct,
    mcv_fL: data.cbc.mcv.value,
    rdw_pct: data.cbc.rdw.value,
    alp_UL: data.chemistry.alp.value,
    wbc_10e3uL: data.cbc.wbc.value *
      unitValues[data.cbc.wbc.unit === "10^3/uL" ? "wbc_10e3uL" : "wbc_10e9L"]
  };
}

function linearPredictor(input: NormalizedInputs): number {
  return (
    parameters.intercept +
    parameters.beta_albumin * input.albumin_gL +
    parameters.beta_creatinine * input.creatinine_umolL +
    parameters.beta_glucose * input.glucose_mmolL +
    parameters.beta_ln_crp * Math.log(input.crp_mg_dL) +
    parameters.beta_lymphocyte * input.lymphocyte_pct +
    parameters.beta_mcv * input.mcv_fL +
    parameters.beta_rdw * input.rdw_pct +
    parameters.beta_alp * input.alp_UL +
    parameters.beta_wbc * input.wbc_10e3uL +
    parameters.beta_age * input.age_years
  );
}

function estimateAge(input: NormalizedInputs, denominator: number): number {
  const xb = linearPredictor(input);
  const stableLogTerm =
    Math.log(
      (parameters.age_transform_scale * parameters.gompertz_num) /
        parameters.gompertz_den
    ) + xb;

  return (
    stableLogTerm / denominator + parameters.age_transform_intercept
  );
}

export const modelVersion = "clinical_phenoage_levine_bioage_2026@2.0.0";

const biomarkerKeys = [
  "albumin_gL",
  "creatinine_umolL",
  "glucose_mmolL",
  "crp_mg_dL",
  "lymphocyte_pct",
  "mcv_fL",
  "rdw_pct",
  "alp_UL",
  "wbc_10e3uL"
] as const;

export type SensitivityKey = (typeof biomarkerKeys)[number];

export type CalculationResult = {
  model_version: string;
  normalized_inputs: NormalizedInputs;
  phenoage_years: number;
  age_gap_years: number;
  alternate_0_09165_years: number;
  alternate_delta_years: number;
  local_sensitivity_plus_1pct_years: Record<SensitivityKey, number>;
};

export function calculate(input: CalculationInput): CalculationResult {
  const normalized = normalizeInputs(input);
  const phenoage = estimateAge(normalized, parameters.age_transform_den);
  const alternate = estimateAge(normalized, parameters.historical_alt_den);
  const sensitivity = {} as Record<SensitivityKey, number>;

  for (const key of biomarkerKeys) {
    const nextValue =
      key === "lymphocyte_pct" && normalized[key] === 0
        ? 0.01
        : normalized[key] * 1.01;
    const perturbed = { ...normalized, [key]: nextValue };
    sensitivity[key] =
      estimateAge(perturbed, parameters.age_transform_den) - phenoage;
  }

  return {
    model_version: modelVersion,
    normalized_inputs: normalized,
    phenoage_years: phenoage,
    age_gap_years: phenoage - normalized.age_years,
    alternate_0_09165_years: alternate,
    alternate_delta_years: alternate - phenoage,
    local_sensitivity_plus_1pct_years: sensitivity
  };
}
