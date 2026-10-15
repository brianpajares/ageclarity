import { NextResponse } from "next/server";
import { modelVersion } from "@/lib/model";
import { getReportInterestConfig, reportInterestEnabled } from "@/lib/report-interest-server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      calculation: "browser-local",
      report_delivery: "not-configured",
      report_interest: {
        enabled: reportInterestEnabled(),
        configured: getReportInterestConfig() !== null,
        scope: "email-only"
      },
      build: {
        branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"
      },
      model_version: modelVersion
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
