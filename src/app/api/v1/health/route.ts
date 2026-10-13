import { NextResponse } from "next/server";
import { modelVersion } from "@/lib/model";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      calculation: "browser-local",
      report_delivery: "not-configured",
      model_version: modelVersion
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
