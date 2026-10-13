import { describe, expect, it } from "vitest";
import vectors from "../../spec/test_vectors.json";
import { calculate } from "./model";

type GoldenVector = {
  id: string;
  description: string;
  expected_status: "ok" | "error";
  inputs: unknown;
  expected_outputs?: {
    phenoage_years?: number;
    age_gap_years?: number;
    alternate_0_09165_years?: number;
    alternate_delta_years?: number;
  };
};

const cases = (vectors as { vectors: GoldenVector[] }).vectors;

describe("Clinical PhenoAge model contract", () => {
  it("matches every successful golden vector within 1e-6 relative tolerance", () => {
    const successful = cases.filter((item) => item.expected_status === "ok");
    expect(successful).toHaveLength(18);

    for (const item of successful) {
      const actual = calculate(item.inputs as Parameters<typeof calculate>[0]);
      const expected = item.expected_outputs;
      const checkRelativeTolerance = (actualValue: number, expectedValue: number | undefined) => {
        expect(expectedValue, `${item.id}: missing expected value`).toBeTypeOf("number");
        expect(
          Math.abs(actualValue - expectedValue!),
          `${item.id}: ${actualValue} != ${expectedValue}`
        ).toBeLessThanOrEqual(Math.max(1e-8, 1e-6 * Math.abs(expectedValue!)));
      };
      checkRelativeTolerance(actual.phenoage_years, expected?.phenoage_years);
      checkRelativeTolerance(actual.age_gap_years, expected?.age_gap_years);
      checkRelativeTolerance(actual.alternate_0_09165_years, expected?.alternate_0_09165_years);
      checkRelativeTolerance(actual.alternate_delta_years, expected?.alternate_delta_years);
    }
  });

  it("rejects every invalid golden vector", () => {
    const invalid = cases.filter((item) => item.expected_status === "error");
    expect(invalid).toHaveLength(10);

    for (const item of invalid) {
      expect(() => calculate(item.inputs as Parameters<typeof calculate>[0]), item.id)
        .toThrow();
    }
  });

  it("normalizes alternate units into the same result", () => {
    const first = cases.find((item) => item.id === "T01");
    const second = cases.find((item) => item.id === "T02");
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(
      calculate(first!.inputs as Parameters<typeof calculate>[0]).phenoage_years
    ).toBeCloseTo(
      calculate(second!.inputs as Parameters<typeof calculate>[0]).phenoage_years,
      10
    );
  });
});
