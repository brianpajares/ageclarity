# Prompt maestro para Codex / Claude Code / Antigravity

Actúa como principal engineer, product designer y security engineer. Construye y prueba AgeClarity v4 basado SOLO en este repositorio. Lee primero README_START_HERE.md, docs/PRD.md, docs/final_audit.md, spec/, ux/, model/ y TASKS.md. No pidas aclaraciones: aplica decisiones reversibles, anótalas en DECISIONS.md. No inventes datos, umbrales clínicos, evidencias ni fuentes.

## Objetivo
Implementa un MVP desplegable en Vercel, con locales ES/EN/PT, entrada manual de nueve biomarcadores + edad, conversión estricta de unidades, motor determinista portado a TypeScript a partir de model/engine_reference.py, preview gratuita, captura de email/consentimiento, solicitud de informe completo, PDF generado con @react-pdf/renderer bajo control admin, email confirmación Resend, persistencia segura Supabase, Drive manifest validado con SHA-256, /admin, analytics sin datos de salud y CI.

## Orden
M0 scaffolding Next.js + TS strict + shadcn + next-intl, M1 motor/unidades/vectores, M2 flujo UX/i18n, M3 SQL/RLS + lead/e-mail/PDF/consentimiento, M4 Drive + cache/fallback y admin, M5 QA + GitHub Actions + Vercel deployment docs. Ejecuta gates de docs/ACCEPTANCE_TESTS.md al acabar cada hito.

## Reglas no negociables
- No cambiar fórmula/constantes ni replicar código GPL externo. 0.090165 principal y 0.09165 solo sensibilidad documentada.
- No llamar edad biológica definitiva, ritmo de envejecimiento ni diagnóstico. Sensibilidad +1% NO es atribución causal.
- No enviar datos clínicos en email al propietario ni a analytics; solo ID y acceso seguro. Solo procesar/guardar bajo consentimiento explícito, cifrado y retención limitada.
- Monetización validation por defecto; bloquear checkout hasta evaluación jurídica y feature flag stripe.
- Drive solo assets de conocimiento: descargar por nombre, validar SHA-256 y respaldar última versión válida, TTL 24h.
- Generar .env.example sin secretos; sincronizar docs con variables reales; usar noindex/admin, MFA, RLS.

## Entregables reales
Código ejecutable, package.json, migraciones, npm run drive:sync, Vitest + Playwright, workflows CI, README actualizado, DECISIONS.md, capturas de pruebas si posibles, instrucciones despliegue y log de pruebas con PASS/FAIL. No afirmar haber desplegado sin evidencia. DoD en PRD §28.
