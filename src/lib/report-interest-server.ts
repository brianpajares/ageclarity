import { createHmac } from "node:crypto";
import { z } from "zod";

const emailAddress = z.string().trim().email().max(254);
const httpsUrl = z.string().url().refine((value) => value.startsWith("https://"));

const configSchema = z.object({
  resendKey: z.string().startsWith("re_").min(12),
  fromEmail: emailAddress,
  ownerEmail: emailAddress,
  supabaseUrl: httpsUrl,
  supabaseKey: z.string().min(20),
  turnstileSecret: z.string().min(10),
  turnstileSiteKey: z.string().min(10),
  redisUrl: httpsUrl,
  redisToken: z.string().min(10),
  rateLimitSecret: z.string().min(32),
  noticeVersion: z.string().min(4).max(40),
  cronSecret: z.string().min(20)
});

export type ReportInterestConfig = z.infer<typeof configSchema>;

export function reportInterestEnabled(): boolean {
  return process.env.REPORT_INTEREST_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_REPORT_INTEREST_ENABLED === "true" &&
    process.env.PRIVACY_NOTICE_APPROVED === "true";
}

export function getReportInterestConfig(): ReportInterestConfig | null {
  if (!reportInterestEnabled()) return null;
  const parsed = configSchema.safeParse({
    resendKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
    ownerEmail: process.env.OWNER_EMAIL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    rateLimitSecret: process.env.RATE_LIMIT_SECRET,
    noticeVersion: process.env.PRIVACY_NOTICE_VERSION,
    cronSecret: process.env.CRON_SECRET
  });
  return parsed.success ? parsed.data : null;
}

export async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

export async function withinRateLimit(config: ReportInterestConfig, ip: string): Promise<boolean> {
  const period = Math.floor(Date.now() / 3_600_000);
  const fingerprint = createHmac("sha256", config.rateLimitSecret).update(ip).digest("hex");
  const key = `ageclarity:report-interest:${period}:${fingerprint}`;
  const response = await fetch(`${config.redisUrl.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([["INCR", key], ["EXPIRE", key, 3600]]),
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return false;
  const result = await response.json() as Array<{ result?: number }>;
  return Number(result[0]?.result) <= 3;
}

type InterestRecord = {
  id: string;
  user_email_sent_at: string | null;
  owner_email_sent_at: string | null;
};

function supabaseHeaders(config: ReportInterestConfig): HeadersInit {
  return {
    apikey: config.supabaseKey,
    Authorization: `Bearer ${config.supabaseKey}`,
    "Content-Type": "application/json"
  };
}

export async function saveInterest(
  config: ReportInterestConfig,
  email: string,
  locale: "es" | "en" | "pt"
): Promise<InterestRecord | null> {
  const endpoint = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/report_interest?on_conflict=email&select=id,user_email_sent_at,owner_email_sent_at`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { ...supabaseHeaders(config), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      email,
      locale,
      privacy_notice_version: config.noticeVersion,
      consented_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 86_400_000).toISOString()
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return null;
  const rows = await response.json() as InterestRecord[];
  return rows[0] ?? null;
}

export async function markEmailSent(
  config: ReportInterestConfig,
  id: string,
  kind: "user" | "owner"
): Promise<boolean> {
  const column = kind === "user" ? "user_email_sent_at" : "owner_email_sent_at";
  const response = await fetch(
    `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/report_interest?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { ...supabaseHeaders(config), Prefer: "return=minimal" },
      body: JSON.stringify({ [column]: new Date().toISOString() }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    }
  );
  return response.ok;
}

const copy = {
  es: {
    subject: "AgeClarity | Confirmamos tu interés",
    user: "Gracias por tu interés en AgeClarity. Registramos tu correo para avisarte cuando los informes ampliados estén disponibles. La calculadora no nos envió tus biomarcadores ni tu resultado. Por ahora no hay un informe adjunto ni un pago pendiente. Si deseas retirar tu consentimiento o pedir que borremos tu dirección, responde a este mensaje.",
    owner: "Nueva solicitud de aviso sobre informes ampliados. No se enviaron biomarcadores ni resultados."
  },
  en: {
    subject: "AgeClarity | Your request is confirmed",
    user: "Thank you for your interest in AgeClarity. We saved your email to notify you when extended reports become available. The calculator did not send us your biomarkers or result. There is no report attached or payment due at this time. Reply to this message if you want to withdraw consent or have your address deleted.",
    owner: "New request for an extended-report availability notice. No biomarkers or results were sent."
  },
  pt: {
    subject: "AgeClarity | Seu interesse foi registrado",
    user: "Obrigado pelo interesse no AgeClarity. Registramos seu e-mail para avisar quando os relatórios ampliados estiverem disponíveis. A calculadora não nos enviou seus biomarcadores nem seu resultado. No momento não há relatório anexado nem pagamento pendente. Responda a esta mensagem se quiser retirar o consentimento ou apagar seu endereço.",
    owner: "Nova solicitação de aviso sobre relatórios ampliados. Nenhum biomarcador ou resultado foi enviado."
  }
} as const;

export async function sendInterestEmail(
  config: ReportInterestConfig,
  kind: "user" | "owner",
  id: string,
  email: string,
  locale: "es" | "en" | "pt"
): Promise<boolean> {
  const language = copy[locale];
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `ageclarity-interest-${kind}-${id}`
    },
    body: JSON.stringify({
      from: `AgeClarity <${config.fromEmail}>`,
      to: [kind === "user" ? email : config.ownerEmail],
      reply_to: config.ownerEmail,
      subject: kind === "user" ? language.subject : `AgeClarity | Solicitud ${id}`,
      text: kind === "user"
        ? language.user
        : `${language.owner}\n\nSolicitud: ${id}\nCorreo: ${email}\nIdioma: ${locale}`
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  return response.ok;
}
