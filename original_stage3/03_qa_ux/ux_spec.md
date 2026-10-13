# UX specification — AgeClarity

**Posicionamiento:** interpreta un indicador fenotípico publicado usando valores de laboratorio ya disponibles; no sustituye consejo médico. **Promesa:** «Comprende tu PhenoAge y cómo se calcula, con fuentes visibles». Tono sereno, preciso, sin alarmismo. Mensajes: transparencia matemática; claridad sobre unidades; privacidad por diseño.

## Rutas y vistas
1. `/` Landing: CTA **Comenzar** y evidencia de modelo; estado sin archivos. 2. `/calcular/edad` a `/calcular/biomarcadores`: 10 datos, agrupados en tres pasos; progreso real, ejemplos sintéticos etiquetados, ayudas y unidades por dato; error inline sin borrar valores. 3. `/procesando`: indicador breve sin prometer IA opaca. 4. `/resultado`: PhenoAge + diferencia y gráfico comparativo; estado error con recuperación; sin etiquetas de salud/riesgo. 5. `/informe`: ejemplo de tabla de sensibilidad y metodología desenfocadas solo como muestra; email voluntario y consentimiento separado de marketing. 6. `/gracias`: confirma solicitud, nunca pago ficticio. 7. `/metodologia`, `/faq`, `/privacidad`, `/terminos`; `/admin` restringida.

**Validación:** edad 20–84, números finitos, biomarcadores positivos, linfocitos 0–100; rechazar texto ambiguo y resultados bajo límite de detección sin inventar un número. Errores no envían información clínica. Un input activo por pantalla móvil con pasos de grupo; indicadores de progreso y accesible teclado.

**IA y reporte:** calculadora determinista sin generador IA en el valor numérico. Evitar promesas de menos de 90 segundos para captura manual de 9 biomarcadores; se puede iniciar en menos de 90 segundos. No usar testimonios inventados ni urgencias falsas.

**SEO:** `/es-pe/edad-fenotipica`, `/es-mx/edad-fenotipica`, `/es-es/edad-fenotipica`, `/pt-br/idade-fenotipica`, `/en/phenotypic-age`, páginas por uso «interpretar análisis de sangre», con referencias, hreflang, canonical y disclaimers.

**WCAG 2.2 AA:** labels reales, errores aria-live, foco visible, navegación solo teclado, contraste ≥4.5:1 cuerpo, objetivos táctiles ≥24 CSS px, layouts probados objetivo 360/768/1280; respetar prefers-reduced-motion; sin dependencia del color.

**Privacidad/seguridad:** transporte TLS, resultados calculados localmente cuando sea posible, no persistencia por defecto, no cookies analíticas sobre datos de biomarcadores, controles de consentimiento, exportar/borrar datos, no usar valores en URL ni en registros.
