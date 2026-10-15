"use client";

import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ReportInterestForm() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorCode, setErrorCode] = useState("");

  if (!turnstileSiteKey) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const challenge = String(data.get("cf-turnstile-response") ?? "");
    if (!challenge) {
      setErrorCode("challenge_required");
      setState("error");
      return;
    }

    setState("sending");
    setErrorCode("");
    try {
      const response = await fetch("/api/reports/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          locale,
          consent: data.get("consent") === "on",
          challenge,
          website: String(data.get("website") ?? "")
        })
      });
      if (!response.ok) {
        const detail = await response.json() as { error?: string };
        setErrorCode(detail.error ?? "interest_unavailable");
        setState("error");
        return;
      }
      form.reset();
      setState("sent");
    } catch {
      setErrorCode("network_error");
      setState("error");
    }
  }

  return (
    <section className="interest-card" aria-labelledby="interest-title">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div>
        <p className="interest-eyebrow">{t("interest.eyebrow")}</p>
        <h4 id="interest-title">{t("interest.title")}</h4>
        <p>{t("interest.body")}</p>
      </div>
      {state === "sent" ? (
        <p className="interest-success" role="status">{t("interest.success")}</p>
      ) : (
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="interest-email">{t("interest.emailLabel")}</label>
          <input
            className="field-input"
            id="interest-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
          <div className="interest-honeypot" aria-hidden="true">
            <label htmlFor="interest-website">Website</label>
            <input id="interest-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <label className="interest-consent">
            <input type="checkbox" name="consent" required />
            <span>{t("interest.consent")}</span>
          </label>
          <a className="interest-privacy-link" href="#privacy">{t("interest.privacyLink")}</a>
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-size="compact" />
          <button className="button button--primary" type="submit" disabled={state === "sending"}>
            {state === "sending" ? t("interest.sending") : t("interest.submit")}
          </button>
          {state === "error" ? (
            <p className="interest-error" role="alert">
              {t("interest.error")} <code>ref: {errorCode}</code>
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
