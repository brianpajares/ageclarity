# Decisiones etapa 4
- D4-01: mantener todos los archivos de etapa 3 sin alteración bajo `original_stage3/`.
- D4-02: modo validation, ninguna pasarela de pago habilitada por defecto.
- D4-03: los emails al dueño no incluirán PDF o biomarcadores en claro aunque la guía general proponga adjuntarlos; se prioriza minimización y acceso autenticado de salud sensible.
- D4-04: cálculo TS determinista, no LLM; evitar reutilizar código GPL de terceros sin revisión legal.
- D4-05: READY_TO_BUILD significa paquete de instrucciones y contratos, no MVP implementado ni aprobado para producción.
- D4-06: pendiente contrastar externamente constante BioAge 0.090165, licencias y precios PPP; hereda limitaciones etapa 3.
- D4-07: snapshots Drive con SHA-256 validados, fallback y TTL 24h; nunca guardar datos de usuario en Drive.
- D4-08: reconciliar 3 checksums del manifiesto y reparar lectura XLSX inlineStr en copia del motor, validando 28/28 vectores.
