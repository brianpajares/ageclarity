import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReportInterestConfig,
  markEmailSent,
  saveInterest,
  sendInterestEmail,
  verifyTurnstile,
  withinRateLimit
} from "@/lib/report-interest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(["es", "en", "pt"]),
  consent: z.literal(true),
  challenge: z.string().min(1).max(4096),
  website: z.string().max(200).optional()
}).strict();

function response(body: Record<string, string | boolean>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}

export async function POST(request: Request) {
  const config = getReportInterestConfig();
  if (!config) return response({ error: "interest_unavailable" }, 503);
  if (Number(request.headers.get("content-length") ?? 0) > 2048) {
    return response({ error: "invalid_request" }, 413);
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return response({ error: "invalid_request" }, 413);
    payload = JSON.parse(raw);
  } catch {
    return response({ error: "invalid_request" }, 400);
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) return response({ error: "invalid_request" }, 422);
  if (parsed.data.website) return response({ ok: true }, 200);

  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";

  try {
    if (!(await verifyTurnstile(parsed.data.challenge, config.turnstileSecret, ip))) {
      return response({ error: "challenge_failed" }, 403);
    }
    if (!(await withinRateLimit(config, ip))) {
      return response({ error: "rate_limited" }, 429);
    }

    const email = parsed.data.email.toLowerCase();
    const record = await saveInterest(config, email, parsed.data.locale);
    if (!record) return response({ error: "interest_unavailable" }, 503);

    if (!record.user_email_sent_at) {
      const sent = await sendInterestEmail(config, "user", record.id, email, parsed.data.locale);
      if (!sent || !(await markEmailSent(config, record.id, "user"))) {
        return response({ error: "email_delivery_failed" }, 503);
      }
    }
    if (!record.owner_email_sent_at) {
      const sent = await sendInterestEmail(config, "owner", record.id, email, parsed.data.locale);
      if (!sent || !(await markEmailSent(config, record.id, "owner"))) {
        return response({ error: "email_delivery_failed" }, 503);
      }
    }
    return response({ ok: true }, 200);
  } catch {
    return response({ error: "interest_unavailable" }, 503);
  }
}
