# Acceptance tests

## AT-01 — Golden vectors
Todos los vectores de spec/test_vectors.json coinciden con Python a tolerancia relativa 1e-6.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-02 — Errores de entrada
Faltantes, unidades incompatibles, NaN, inf, CRP<=0 y edad fuera 20–84 se rechazan.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-03 — Exactitud motor
Motor TS determinista independiente reproduce 0.090165 y escenario alternativo, sin overflow.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-04 — Preview
Solo 4 campos gratuitos, disclaimer, no percentil ni diagnóstico.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-05 — Consentimiento
Sin opt-in no hay lead; marketing separado, timestamp y versión política.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-06 — Email seguro
Resend mock: ID sin resultados clínicos al owner, confirmación a usuario y logs sin PHI.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-07 — RLS
anon y authenticated no pueden seleccionar ninguna tabla sensible.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-08 — Admin
Cuenta sin allowlist recibe 403; MFA obligatorio para admin.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-09 — Locales
ES/EN/PT-BR sin cadenas ausentes y formatos correctos.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-10 — PDF
Incluye versión, unidades, limitación, metodología, no causalidad; generado solo autorizado.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-11 — Drive
Archivo manipulado checksum falla y snapshot antiguo verificado continúa.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-12 — Analítica
No incluye biomarcadores, email, edad exacta ni PDF en eventos o Sentry.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-13 — Despliegue y calidad
Lighthouse móvil >=90 4 categorías, p95 cálculo <2s 50 req/min.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-14 — Privacidad
Borrado y retención purgan leads/inputs derivados dentro de política; auditoría.
**Estado actual:** pendiente de ejecución sobre MVP implementado.

## AT-15 — Pago bloqueado
MONETIZATION_MODE=validation no muestra ni acepta Stripe checkout o webhooks.
**Estado actual:** pendiente de ejecución sobre MVP implementado.
