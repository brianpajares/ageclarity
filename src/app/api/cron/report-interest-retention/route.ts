import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.REPORT_INTEREST_ENABLED !== "true") {
    return NextResponse.json({ status: "disabled" }, { headers: { "Cache-Control": "no-store" } });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  try {
    const cutoff = encodeURIComponent(new Date().toISOString());
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/report_interest?expires_at=lt.${cutoff}`,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "return=minimal"
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!response.ok) throw new Error("retention_failed");
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "retention_failed" }, { status: 503 });
  }
}
