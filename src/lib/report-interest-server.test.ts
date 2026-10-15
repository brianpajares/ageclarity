import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getReportInterestConfig,
  saveInterest,
  sendInterestEmail,
  verifyTurnstile,
  withinRateLimit,
  type ReportInterestConfig
} from "./report-interest-server";

const config: ReportInterestConfig = {
  resendKey: `re_${"a".repeat(30)}`,
  fromEmail: "hello@example.com",
  ownerEmail: "owner@example.com",
  supabaseUrl: "https://project.supabase.co",
  supabaseKey: "service-key-example-123456",
  turnstileSecret: "turnstile-secret-example",
  turnstileSiteKey: "turnstile-site-example",
  redisUrl: "https://example.upstash.io",
  redisToken: "redis-token-example",
  rateLimitSecret: "a".repeat(40),
  noticeVersion: "2026-10-15",
  cronSecret: "c".repeat(40)
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("report interest email preparation", () => {
  it("remains disabled until every switch and required setting is present", () => {
    expect(getReportInterestConfig()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_REPORT_INTEREST_ENABLED", "true");
    vi.stubEnv("REPORT_INTEREST_ENABLED", "true");
    vi.stubEnv("PRIVACY_NOTICE_APPROVED", "true");
    expect(getReportInterestConfig()).toBeNull();
    for (const [name, value] of Object.entries({
      RESEND_API_KEY: config.resendKey,
      RESEND_FROM_EMAIL: config.fromEmail,
      OWNER_EMAIL: config.ownerEmail,
      SUPABASE_URL: config.supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: config.supabaseKey,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: config.turnstileSiteKey,
      TURNSTILE_SECRET_KEY: config.turnstileSecret,
      UPSTASH_REDIS_REST_URL: config.redisUrl,
      UPSTASH_REDIS_REST_TOKEN: config.redisToken,
      RATE_LIMIT_SECRET: config.rateLimitSecret,
      PRIVACY_NOTICE_VERSION: config.noticeVersion,
      CRON_SECRET: config.cronSecret
    })) vi.stubEnv(name, value);
    expect(getReportInterestConfig()).not.toBeNull();
  });

  it("persists only email and consent metadata", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json([{
      id: "example-id", user_email_sent_at: null, owner_email_sent_at: null
    }]));
    vi.stubGlobal("fetch", fetchMock);
    const saved = await saveInterest(config, "person@example.com", "es");
    expect(saved?.id).toBe("example-id");
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(options.body));
    expect(Object.keys(body).sort()).toEqual([
      "consented_at", "email", "expires_at", "locale", "privacy_notice_version"
    ]);
    expect(body.email).toBe("person@example.com");
  });

  it("sends no biomarker or PhenoAge value in either email", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: "sent" }));
    vi.stubGlobal("fetch", fetchMock);
    await sendInterestEmail(config, "user", "example-id", "person@example.com", "es");
    await sendInterestEmail(config, "owner", "example-id", "person@example.com", "es");
    const user = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    const owner = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
    expect(user.to).toEqual(["person@example.com"]);
    expect(owner.to).toEqual(["owner@example.com"]);
    expect(user).not.toHaveProperty("attachments");
    expect(owner).not.toHaveProperty("attachments");
    expect(`${user.text} ${owner.text}`).not.toMatch(/35\.9|albumin|creatinine/i);
  });

  it("fails closed on an invalid Turnstile challenge or rate limit response", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ success: false }))
      .mockResolvedValueOnce(Response.json([{ result: 4 }, { result: 1 }]));
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyTurnstile("bad", config.turnstileSecret, "192.0.2.1")).toBe(false);
    expect(await withinRateLimit(config, "192.0.2.1")).toBe(false);
    const body = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
    expect(JSON.stringify(body)).not.toContain("192.0.2.1");
  });
});
