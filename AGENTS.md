# Reglas para agentes de programación
Leer `BUILD_PROMPT.md`, `docs/PRD.md`, `TASKS.md`, `docs/ACCEPTANCE_TESTS.md`, `spec/` y `docs/final_audit.md` antes de editar.
Comandos de la futura implementación: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run drive:sync`, `npm run build`. Crear scripts correspondientes.
TypeScript strict y server-only para secretos; Zod como validación; jamás inventar respuestas clínicas ni copiar GPL externa. Registrar toda desviación en `DECISIONS.md` con fecha, impacto y pruebas. Probar en staging con servicios simulados antes de producción. Data minimization estricta.
