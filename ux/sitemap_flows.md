# Sitemap y flujos

```mermaid
flowchart TD
A[Landing] --> B[Edad y país]
B --> C[Bioquímica]
C --> D[Inflamación y hemograma]
D --> E{Validación}
E -->|Error| D
E -->|Correcto| F[Resultado gratuito]
F --> G[Vista previa informe]
G --> H{Desea recibirlo}
H -->|Sí| I[Correo y consentimiento]
H -->|No| F
I --> J[Confirmación sin pago]
A --> K[Metodología y fuentes]
A --> L[FAQ / Privacidad / Legal]
```

Rutas: `/`, `/calcular`, `/resultado`, `/informe`, `/gracias`, `/metodologia`, `/faq`, `/privacidad`, `/terminos`, `/admin`. Localización por prefijo `/es-pe`, `/es-mx`, `/es-es`, `/pt-br`, `/en`.
