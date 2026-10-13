"use client";

import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { calculate, type CalculationInput, type CalculationResult } from "@/lib/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";

type MeasurementKey =
  | "albumin"
  | "creatinine"
  | "glucose"
  | "alp"
  | "crp"
  | "lymphocyte"
  | "mcv"
  | "rdw"
  | "wbc";

type MeasurementUnits = {
  albumin: "g/L" | "g/dL";
  creatinine: "umol/L" | "mg/dL";
  glucose: "mmol/L" | "mg/dL";
  alp: "U/L";
  crp: "mg/dL" | "mg/L";
  lymphocyte: "%";
  mcv: "fL";
  rdw: "%";
  wbc: "10^3/uL" | "10^9/L";
};

type MeasurementState = {
  [Key in MeasurementKey]: { value: string; unit: MeasurementUnits[Key] };
};

type FormState = { age: string; measurements: MeasurementState };
type FormField = "age" | MeasurementKey;
type FieldErrors = Partial<Record<FormField, string>>;

const emptyForm = (): FormState => ({
  age: "",
  measurements: {
    albumin: { value: "", unit: "g/L" },
    creatinine: { value: "", unit: "umol/L" },
    glucose: { value: "", unit: "mmol/L" },
    alp: { value: "", unit: "U/L" },
    crp: { value: "", unit: "mg/L" },
    lymphocyte: { value: "", unit: "%" },
    mcv: { value: "", unit: "fL" },
    rdw: { value: "", unit: "%" },
    wbc: { value: "", unit: "10^9/L" }
  }
});

const unitOptions: Record<MeasurementKey, readonly string[]> = {
  albumin: ["g/L", "g/dL"],
  creatinine: ["umol/L", "mg/dL"],
  glucose: ["mmol/L", "mg/dL"],
  alp: ["U/L"],
  crp: ["mg/L", "mg/dL"],
  lymphocyte: ["%"],
  mcv: ["fL"],
  rdw: ["%"],
  wbc: ["10^9/L", "10^3/uL"]
};

const fieldsByStep: Record<2 | 3, MeasurementKey[]> = {
  2: ["albumin", "creatinine", "glucose", "alp"],
  3: ["crp", "lymphocyte", "mcv", "rdw", "wbc"]
};

function parseField(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function makeInput(form: FormState): CalculationInput {
  const value = (key: MeasurementKey) => Number(form.measurements[key].value);

  return {
    age: Number(form.age),
    chemistry: {
      albumin: {
        value: value("albumin"),
        unit: form.measurements.albumin.unit
      },
      creatinine: {
        value: value("creatinine"),
        unit: form.measurements.creatinine.unit
      },
      glucose: {
        value: value("glucose"),
        unit: form.measurements.glucose.unit
      },
      alp: { value: value("alp"), unit: "U/L" }
    },
    inflammation: {
      crp: { value: value("crp"), unit: form.measurements.crp.unit }
    },
    cbc: {
      lymphocyte_pct: value("lymphocyte"),
      mcv: { value: value("mcv"), unit: "fL" },
      rdw: { value: value("rdw"), unit: "%" },
      wbc: { value: value("wbc"), unit: form.measurements.wbc.unit }
    }
  };
}

export function AgeClarityApp() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [summaryError, setSummaryError] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const numberLocale = locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : "es-PE";
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 1 }),
    [numberLocale]
  );
  const signedFormat = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        maximumFractionDigits: 1,
        signDisplay: "always"
      }),
    [numberLocale]
  );

  function validate(currentStep: 1 | 2 | 3): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (currentStep === 1) {
      const age = parseField(form.age);
      if (age === null || age < 20 || age > 84) nextErrors.age = t("calculator.errors.age");
      return nextErrors;
    }

    for (const key of fieldsByStep[currentStep]) {
      const value = parseField(form.measurements[key].value);
      if (value === null) {
        nextErrors[key] = t("calculator.errors.required");
      } else if (key === "lymphocyte") {
        if (value < 0 || value > 100) {
          nextErrors[key] = t("calculator.errors.lymphocyte");
        }
      } else if (value <= 0) {
        nextErrors[key] =
          key === "crp" ? t("calculator.errors.crp") : t("calculator.errors.positive");
      }
    }
    return nextErrors;
  }

  function goTo(nextStep: 1 | 2 | 3) {
    setStep(nextStep);
    setErrors({});
    setSummaryError("");
  }

  function advance() {
    const found = validate(step);
    setErrors(found);
    setSummaryError(Object.keys(found).length ? t("calculator.errors.summary") : "");
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(first)?.focus();
      return;
    }
    if (step < 3) {
      goTo((step + 1) as 2 | 3);
      scrollToCalculator();
      return;
    }

    try {
      setResult(calculate(makeInput(form)));
      setSummaryError("");
      scrollToCalculator();
    } catch {
      setSummaryError(t("calculator.errors.summary"));
    }
  }

  function scrollToCalculator() {
    window.setTimeout(() => {
      document.getElementById("calculator-card")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start"
      });
    }, 0);
  }

  function updateMeasurement<K extends MeasurementKey>(
    key: K,
    update: { value: string } | { unit: MeasurementUnits[K] }
  ) {
    setForm((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [key]: { ...current.measurements[key], ...update }
      }
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSummaryError("");
  }

  function reset() {
    setForm(emptyForm());
    setResult(null);
    setErrors({});
    setSummaryError("");
    goTo(1);
    scrollToCalculator();
  }

  function renderMeasurement(key: MeasurementKey) {
    const label = t(`calculator.fields.${key}`);
    const hint = t(`calculator.hints.${key}`);
    const error = errors[key];
    const current = form.measurements[key];
    const id = key;

    return (
      <div className={`field ${error ? "field--error" : ""}`} key={key}>
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        <p className="field-help" id={`${id}-help`}>
          {hint}
        </p>
        <div className="field-control-row">
          <Input
            id={id}
            name={id}
            type="number"
            inputMode="decimal"
            step="any"
            value={current.value}
            onChange={(event) => updateMeasurement(key, { value: event.target.value })}
            aria-describedby={`${id}-help ${error ? `${id}-error` : ""}`.trim()}
            aria-invalid={Boolean(error)}
            invalid={Boolean(error)}
            autoComplete="off"
          />
          <label className="sr-only" htmlFor={`${id}-unit`}>
            {t("calculator.fields.unit", { name: label })}
          </label>
          <select
            className="unit-select"
            id={`${id}-unit`}
            value={current.unit}
            onChange={(event) =>
              updateMeasurement(key, { unit: event.target.value as MeasurementUnits[typeof key] })
            }
            aria-label={t("calculator.fields.unit", { name: label })}
          >
            {unitOptions[key].map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="field-error" id={`${id}-error`} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const stepTitles = [
    t("calculator.steps.age"),
    t("calculator.steps.chemistry"),
    t("calculator.steps.blood")
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label={t("nav.home")}>
            <span className="brand-mark" aria-hidden="true">
              <Activity size={21} strokeWidth={2.2} />
            </span>
            <span>AgeClarity</span>
          </Link>
          <nav className="desktop-nav" aria-label={t("nav.primary")}>
            <a href="#methodology">{t("nav.method")}</a>
            <a href="#privacy">{t("nav.privacy")}</a>
            <a className="nav-cta" href="#calculator">
              {t("nav.start")} <ArrowUpRight size={16} />
            </a>
          </nav>
          <div className="locale-picker" aria-label={t("nav.language")}>
            {(["es", "en", "pt"] as const).map((language) => (
              <a
                key={language}
                href={`/${language}`}
                className={locale === language ? "locale-link locale-link--active" : "locale-link"}
                aria-label={language === "es" ? "Español" : language === "en" ? "English" : "Português"}
                aria-current={locale === language ? "page" : undefined}
              >
                {language.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main id="main">
        <section className="hero-section">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-inner page-shell">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" />{t("hero.eyebrow")}</p>
              <h1>{t("hero.title")}</h1>
              <p className="hero-description">{t("hero.body")}</p>
              <div className="hero-actions">
                <a className="button button--primary" href="#calculator">
                  {t("hero.cta")} <ArrowRight size={18} />
                </a>
                <a className="button button--text" href="#methodology">
                  {t("hero.secondary")}
                </a>
              </div>
              <div className="hero-trust-row">
                <span><LockKeyhole size={15} />{t("hero.privacy")}</span>
                <span><Check size={15} />{t("hero.noAccount")}</span>
                <span><Check size={15} />{t("hero.noSave")}</span>
              </div>
            </div>

            <div className="hero-art" aria-label={t("hero.visualTitle")}>
              <div className="art-orbit art-orbit--one" />
              <div className="art-orbit art-orbit--two" />
              <div className="art-card">
                <div className="art-card-header">
                  <span className="art-icon"><Sparkles size={19} /></span>
                  <span className="art-caption">AGECLARITY / MODEL VIEW</span>
                  <span className="art-live-dot" />
                </div>
                <h2>{t("hero.visualTitle")}</h2>
                <p className="art-note">{t("hero.visualCaption")}</p>
                <div className="art-flow">
                  <div className="art-flow-item">
                    <span className="art-step-number">01</span>
                    <span className="art-flow-icon"><FlaskConical size={19} /></span>
                    <span>{t("hero.visualStep1")}</span>
                  </div>
                  <div className="art-flow-line"><ArrowDown size={16} /></div>
                  <div className="art-flow-item art-flow-item--highlight">
                    <span className="art-step-number">02</span>
                    <span className="art-flow-icon"><Activity size={19} /></span>
                    <span>{t("hero.visualStep2")}</span>
                  </div>
                  <div className="art-flow-line"><ArrowDown size={16} /></div>
                  <div className="art-flow-item">
                    <span className="art-step-number">03</span>
                    <span className="art-flow-icon"><ShieldCheck size={19} /></span>
                    <span>{t("hero.visualStep3")}</span>
                  </div>
                </div>
                <div className="art-footnote"><span className="art-sparkle">✳</span>{t("hero.visualQualities")}</div>
              </div>
              <div className="art-accent art-accent--top" />
              <div className="art-accent art-accent--bottom" />
            </div>
          </div>
          <div className="hero-bottom-rule page-shell"><span /> <span>01 — 03</span></div>
        </section>

        <section className="intro-section page-shell">
          <div className="intro-mark"><span>01</span><div /></div>
          <div className="intro-copy">
            <p className="eyebrow eyebrow--muted">{t("intro.eyebrow")}</p>
            <h2>{t("intro.title")}</h2>
            <p>{t("intro.body")}</p>
          </div>
          <div className="intro-proof">
            <div className="proof-item"><span className="proof-number">09</span><span>{t("intro.proofBiomarkers")}</span></div>
            <div className="proof-item"><span className="proof-number">03</span><span>{t("intro.proofSteps")}</span></div>
            <div className="proof-item"><span className="proof-number">0</span><span>{t("intro.proofStored")}</span></div>
          </div>
        </section>

        <section className="calculator-section" id="calculator">
          <div className="calculator-shell page-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow eyebrow--light">{t("calculator.eyebrow")}</p>
                <h2>{t("calculator.title")}</h2>
                <p>{t("calculator.subtitle")}</p>
              </div>
              <div className="calculator-lock"><LockKeyhole size={18} /><span>{t("hero.privacy")}</span></div>
            </div>

            <div className="calculator-card" id="calculator-card">
              {result ? (
                <div className="result-view" aria-live="polite">
                  <div className="result-header">
                    <div>
                      <p className="result-eyebrow"><span className="result-dot" />{t("result.eyebrow")}</p>
                      <h3>{t("result.title")}</h3>
                    </div>
                    <Button variant="text" onClick={() => { setResult(null); goTo(3); }}>
                      {t("calculator.edit")}
                    </Button>
                  </div>

                  <div className="result-grid">
                    <div className="result-main-card">
                      <span className="result-kicker">{t("result.estimated")}</span>
                      <div className="result-number">
                        {numberFormat.format(result.phenoage_years)}
                        <span> {t("result.unit")}</span>
                      </div>
                      <div className="result-gap-row">
                        <span>{t("result.gap")}</span>
                        <strong>{signedFormat.format(result.age_gap_years)} {t("result.unit")}</strong>
                      </div>
                      <p className="result-method-note">{t("result.methodNote")}</p>
                    </div>

                    <div className="comparison-card">
                      <h4>{t("result.comparison")}</h4>
                      <AgeComparison
                        chronological={form.age}
                        estimate={result.phenoage_years}
                        numberFormat={numberFormat}
                        labels={{ chronological: t("result.chronological"), estimated: t("result.estimated") }}
                      />
                      <p className="comparison-caption">{t("result.disclaimer")}</p>
                    </div>
                  </div>

                  <div className="report-note">
                    <span className="report-note-icon"><FlaskConical size={19} /></span>
                    <div>
                      <h4>{t("result.reportTitle")}</h4>
                      <p>{t("result.reportBody")}</p>
                    </div>
                    <a href="#methodology" className="report-method-link">{t("result.methodLink")} <ArrowUpRight size={16} /></a>
                  </div>

                  <div className="result-actions">
                    <Button variant="secondary" onClick={reset}>
                      <RotateCcw size={16} /> {t("result.restart")}
                    </Button>
                    <span className="privacy-inline"><LockKeyhole size={14} />{t("privacy.note")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="progress-header">
                    <div className="progress-text">
                      <span className="progress-number">0{step}</span>
                      <span>{t("calculator.stepLabel", { current: step, total: 3 })}</span>
                      <span className="progress-divider">/</span>
                      <strong>{stepTitles[step - 1]}</strong>
                    </div>
                    <span className="progress-percent">{Math.round((step / 3) * 100)}%</span>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={t("calculator.stepLabel", { current: step, total: 3 })}
                    aria-valuemin={1}
                    aria-valuemax={3}
                    aria-valuenow={step}
                  >
                    <span style={{ width: `${(step / 3) * 100}%` }} />
                  </div>

                  <div className="step-tabs" aria-label={t("calculator.stepLabel", { current: step, total: 3 })}>
                    {stepTitles.map((title, index) => {
                      const number = (index + 1) as 1 | 2 | 3;
                      const isComplete = step > number;
                      return (
                        <div className={`step-tab ${step === number ? "step-tab--active" : ""} ${isComplete ? "step-tab--done" : ""}`} key={title}>
                          <span className="step-tab-number">{isComplete ? <Check size={13} /> : `0${number}`}</span>
                          <span>{title}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="step-content" key={step}>
                    {step === 1 ? (
                      <>
                        <div className="step-title-row">
                          <span className="step-icon"><Activity size={19} /></span>
                          <div><h3>{t("calculator.ageTitle")}</h3><p>{t("calculator.ageBody")}</p></div>
                        </div>
                        <div className={`field age-field ${errors.age ? "field--error" : ""}`}>
                          <label className="field-label" htmlFor="age">{t("calculator.ageLabel")}</label>
                          <p className="field-help" id="age-help">{t("calculator.ageHelp")}</p>
                          <div className="age-input-row">
                            <Input
                              id="age"
                              name="age"
                              type="number"
                              inputMode="numeric"
                              min={20}
                              max={84}
                              step={1}
                              value={form.age}
                              onChange={(event) => {
                                setForm((current) => ({ ...current, age: event.target.value }));
                                setErrors((current) => ({ ...current, age: undefined }));
                                setSummaryError("");
                              }}
                              aria-describedby={`age-help ${errors.age ? "age-error" : ""}`.trim()}
                              aria-invalid={Boolean(errors.age)}
                              invalid={Boolean(errors.age)}
                              autoComplete="off"
                            />
                            <span className="age-unit">{t("calculator.years")}</span>
                          </div>
                          {errors.age ? <p className="field-error" id="age-error" role="alert">{errors.age}</p> : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="step-title-row">
                          <span className="step-icon"><FlaskConical size={19} /></span>
                          <div>
                            <h3>{t(step === 2 ? "calculator.chemistryTitle" : "calculator.bloodTitle")}</h3>
                            <p>{t(step === 2 ? "calculator.chemistryBody" : "calculator.bloodBody")}</p>
                          </div>
                        </div>
                        {step === 2 ? <div className="fields-grid">{fieldsByStep[2].map(renderMeasurement)}</div> : <div className="fields-grid fields-grid--three">{fieldsByStep[3].map(renderMeasurement)}</div>}
                        <p className="unit-reassurance"><ShieldCheck size={15} />{t("calculator.hints.labUnit")}</p>
                      </>
                    )}
                  </div>

                  {summaryError ? <p className="form-summary-error" role="alert">{summaryError}</p> : null}
                  <div className="step-actions">
                    {step > 1 ? (
                      <Button variant="text" onClick={() => goTo((step - 1) as 1 | 2)}>
                        <ChevronLeft size={17} /> {t("calculator.back")}
                      </Button>
                    ) : <span />}
                    <Button onClick={advance}>
                      {step === 3 ? t("calculator.calculate") : t("calculator.next")}
                      <ChevronRight size={17} />
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="calculator-bottom-note">
              <span><LockKeyhole size={15} />{t("privacy.body")}</span>
              <a href="#privacy">{t("nav.privacy")} <ArrowRight size={14} /></a>
            </div>
          </div>
        </section>

        <section className="privacy-section page-shell" id="privacy">
          <div className="privacy-illustration" aria-hidden="true">
            <div className="privacy-ring privacy-ring--outer" />
            <div className="privacy-ring privacy-ring--inner" />
            <div className="privacy-lock"><LockKeyhole size={35} /></div>
            <span className="privacy-spark privacy-spark--one">✳</span>
            <span className="privacy-spark privacy-spark--two">✳</span>
          </div>
          <div className="privacy-copy">
            <p className="eyebrow eyebrow--muted">{t("privacy.eyebrow")}</p>
            <h2>{t("privacy.title")}</h2>
            <p>{t("privacy.body")}</p>
            <div className="privacy-note"><Check size={16} />{t("privacy.note")}</div>
          </div>
        </section>

        <section className="method-section" id="methodology">
          <div className="page-shell method-grid">
            <div className="method-heading">
              <p className="eyebrow eyebrow--light">{t("method.eyebrow")}</p>
              <h2>{t("method.title")}</h2>
              <p>{t("method.body")}</p>
              <a className="method-source" href="https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718" target="_blank" rel="noreferrer">
                {t("method.link")} <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="method-details">
              <div className="method-version">
                <span className="method-version-icon"><Activity size={18} /></span>
                <span><small>{t("method.versionLabel")}</small><strong>{t("method.version")}</strong></span>
                <span className="method-status"><Check size={13} /></span>
              </div>
              <div className="method-rule" />
              <div className="method-source-row">
                <span className="method-number">01</span>
                <span><small>{t("method.source")}</small><a href="https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002718" target="_blank" rel="noreferrer">{t("method.sourceLink")} <ArrowUpRight size={13} /></a></span>
              </div>
              <div className="method-rule" />
              <div className="method-limit-row">
                <span className="method-number">02</span>
                <span><strong>{t("method.limitsTitle")}</strong><p>{t("method.limits")}</p></span>
              </div>
              <div className="method-constant"><span>i</span><p>{t("method.constant")}</p></div>
            </div>
          </div>
        </section>

        <section className="faq-section page-shell" id="faq">
          <div className="faq-heading">
            <p className="eyebrow eyebrow--muted">{t("faq.eyebrow")}</p>
            <h2>{t("faq.title")}</h2>
          </div>
          <div className="faq-list">
            {([1, 2, 3, 4] as const).map((number) => (
              <details className="faq-item" key={number}>
                <summary><span>{t(`faq.q${number}`)}</span><span className="faq-toggle"><ChevronRight size={17} /></span></summary>
                <p>{t(`faq.a${number}`)}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-inner">
          <div className="footer-brand-block">
            <Link href="/" className="brand brand--footer">
              <span className="brand-mark" aria-hidden="true"><Activity size={20} /></span>
              <span>{t("footer.brand")}</span>
            </Link>
            <p>{t("footer.tagline")}</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#methodology">{t("footer.method")}</a>
            <a href="#privacy">{t("footer.privacy")}</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="footer-note">
            <span>{t("footer.disclaimer")}</span>
            <span>© 2026 AgeClarity · {t("method.versionLabel")} 2.0.0</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function AgeComparison({
  chronological,
  estimate,
  numberFormat,
  labels
}: {
  chronological: string;
  estimate: number;
  numberFormat: Intl.NumberFormat;
  labels: { chronological: string; estimated: string };
}) {
  const age = Number(chronological);
  const low = Math.min(age, estimate);
  const high = Math.max(age, estimate);
  const span = Math.max(high - low, 1);
  const padding = Math.max(span * 0.45, 3);
  const min = low - padding;
  const max = high + padding;
  const agePosition = ((age - min) / (max - min)) * 100;
  const estimatePosition = ((estimate - min) / (max - min)) * 100;

  return (
    <figure className="age-comparison">
      <div className="comparison-scale" aria-hidden="true">
        <span className="scale-line" />
        <span className="scale-marker scale-marker--age" style={{ left: `${agePosition}%` }} />
        <span className="scale-marker scale-marker--estimate" style={{ left: `${estimatePosition}%` }} />
        <span className="scale-min">{numberFormat.format(min)}</span>
        <span className="scale-max">{numberFormat.format(max)}</span>
      </div>
      <figcaption className="comparison-values">
        <span><i className="legend-dot legend-dot--age" />{labels.chronological}<strong>{numberFormat.format(age)}</strong></span>
        <span><i className="legend-dot legend-dot--estimate" />{labels.estimated}<strong>{numberFormat.format(estimate)}</strong></span>
      </figcaption>
    </figure>
  );
}
