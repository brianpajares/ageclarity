# Backlog ejecutable

Estado: 2026-10-13. El MVP de cálculo en navegador y las comprobaciones locales están implementados. Las tareas marcadas completas tienen comprobación de contrato o e2e local; CI hospedado y requisitos de lanzamiento quedan pendientes hasta ejecutarlos/configurarlos.

## M0 Plataforma
- [x] Inicializar Next.js App Router + TS strict, ESLint, Vitest y Playwright. Shadcn CLI no estuvo disponible; se usan primitivas locales accesibles. **Pendiente:** confirmar un primer CI hospedado.
- [x] Implementar next-intl /es,/en,/pt, layout responsive y metadata SEO. **Pendiente:** revisión SEO en producción.
- [ ] Configurar CI workflow y entornos dev/staging/prod. Workflow agregado; CI hospedado y staging/prod aún no están configurados.

## M1 Modelo
- [x] Portar normalización y ecuaciones Python a TS puro.
- [x] Ejecutar los 28 vectores golden y probar conversión de unidades.
- [x] Versionar coeficientes y límites de entrada.

## M2 Experiencia
- [x] Formulario de nueve biomarcadores con selector de unidad.
- [x] Preview y comparación simple con disclaimer educativo.
- [ ] CTA informe + interfaz consentimiento explícito. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.

## M3 Datos/entrega
- [ ] Aplicar SQL Supabase, tests RLS y cifrado a nivel aplicación. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
- [ ] POST lead, token temporal y Turnstile/rate limit. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
- [ ] Resend, PDF privado y envío admin minimizado. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.

## M4 Operación
- [ ] Drive scan por nombre y SHA-256, cache 24h y fallback. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
- [ ] /admin con MFA/leads/reenviar y auditoría. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
- [ ] Stripe detrás del flag, sin activar compras. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.

## M5 Lanzamiento
- [ ] E2E, a11y, Lighthouse>=90, p95<2s y seguridad. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
- [ ] Ensayo de restauración + smoke staging y registro de resultados. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
- [ ] Legal copy, privacidad, cookies, DNS y verificación de email. **Aceptación:** funcionalidad probada en CI con prueba de contrato o e2e pertinente; evidencia en PR.
