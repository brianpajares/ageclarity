import { NextResponse } from "next/server";
import { calculate, calculationInputSchema, modelVersion } from "@/lib/model";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const parsed = calculationInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 422, headers: { "Cache-Control": "no-store" } }
    );
  }

  const result = calculate(parsed.data);
  return NextResponse.json(
    {
      phenoage_years: result.phenoage_years,
      age_gap_years: result.age_gap_years,
      model_version: modelVersion,
      disclaimer:
        "Educational estimate only. Not a diagnosis, treatment recommendation, pace of aging, or individual life-expectancy prediction."
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
