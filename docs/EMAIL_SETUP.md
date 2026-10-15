# Preparar el correo de AgeClarity

Estado: código preparado, **desactivado por defecto**. Este flujo confirma interés en informes futuros. No adjunta PDF, no cobra y no transmite biomarcadores ni el resultado PhenoAge. La solicitud guarda solo correo, idioma y consentimiento. El responsable recibe la dirección y un ID, sin datos de salud.

## 1. Decisiones antes de activarlo

- Confirmar el dominio remitente, el buzón responsable y la identidad legal del responsable del tratamiento. No se han supuesto a partir del playbook.
- Revisar y publicar un aviso de privacidad completo con identidad, contacto, finalidad, Supabase/Resend/Cloudflare/Upstash, región de tratamiento, plazo de 90 días, derechos y mecanismo de borrado. El texto breve de la página no sustituye esa revisión.
- Ejecutar [email_setup.sql](email_setup.sql) en Supabase → SQL Editor. La consulta final debe mostrar `rowsecurity = true` para `report_interest`.
- Configurar el correo de origen en Resend → Domains. Crear exactamente los registros DKIM, SPF y MX que muestre Resend en el **proveedor DNS indicado por los nameservers**. No copiar valores abreviados de guías ni alterar el MX del buzón principal. Esperar a que Resend indique **Verified**.
- Crear un widget de Cloudflare Turnstile para los dominios de Production y Preview; crear una base Upstash Redis para el límite de tres solicitudes por IP y hora. La clave de IP se guarda como HMAC y vence en una hora.

## 2. Variables en Vercel

Vercel → proyecto AgeClarity → Settings → Environment Variables. Configure valores diferentes de prueba en **Preview** y reales en **Production** cuando corresponda. No pegue secretos en GitHub, el chat ni `.env.example`. Haga Redeploy del entorno afectado tras cualquier cambio.

| Variable | Valor esperado | Uso |
| --- | --- | --- |
| `RESEND_API_KEY` | Clave secreta de Resend, `re_…` | Envío desde servidor |
| `RESEND_FROM_EMAIL` | Solo `correo@dominio-verificado` | Remitente; el código añade `AgeClarity <…>` |
| `OWNER_EMAIL` | Solo la dirección del responsable | Respuestas y aviso sin datos clínicos |
| `SUPABASE_URL` | URL HTTPS del proyecto | Registro del consentimiento |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de servicio | Solo servidor; nunca `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clave pública del widget | Desafío visible |
| `TURNSTILE_SECRET_KEY` | Clave secreta del widget | Verificación en servidor |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS de Upstash | Límite de solicitudes |
| `UPSTASH_REDIS_REST_TOKEN` | Token secreto de Upstash | Límite de solicitudes |
| `RATE_LIMIT_SECRET` | Al menos 32 caracteres aleatorios | HMAC de IP; no se guarda IP en claro |
| `CRON_SECRET` | Secreto aleatorio | Autoriza purga diaria; requerido por Vercel Cron |
| `PRIVACY_NOTICE_VERSION` | Versión publicada, p. ej. fecha ISO | Registro de consentimiento |
| `PRIVACY_NOTICE_APPROVED` | `true` solo tras revisión | Bloqueo del endpoint |
| `REPORT_INTEREST_ENABLED` | `true` al lanzar | Bloqueo del endpoint |
| `NEXT_PUBLIC_REPORT_INTEREST_ENABLED` | `true` al lanzar | Muestra el formulario |

Los tres interruptores de la última parte del cuadro comienzan en `false`. Al activar el formulario, haga que ambos `REPORT_INTEREST_ENABLED` coincidan y confirme antes el aviso de privacidad. La página `/api/v1/health` informa `report_interest.enabled` y `report_interest.configured` sin revelar secretos. `report_delivery` continúa como `not-configured` porque el informe PDF todavía no se envía.

## 3. Funcionamiento y comprobación de configuración

1. En Preview, configure todo con dominio de correo verificado y el SQL aplicado. La ruta `/api/v1/health` debe mostrar `report_interest.enabled: true` y `configured: true`.
2. Complete el formulario con una dirección propia y el consentimiento. Resend → Emails/Logs debe mostrar el correo de confirmación al usuario y el aviso al responsable. No debe aparecer ningún análisis en mensajes, logs ni en la tabla.
3. Compruebe que la tabla `report_interest` contiene correo, idioma, fecha, versión de aviso y vencimiento, sin campos clínicos.
4. Vercel ejecuta `/api/cron/report-interest-retention` diariamente a las 03:00 UTC. Revise su ejecución y pruebe la eliminación de un registro de prueba vencido antes de activar Production.

Los errores de correo se muestran con un `ref:` corto. `interest_unavailable` indica configuración o almacenamiento; `challenge_failed`, Turnstile; `rate_limited`, demasiadas solicitudes; `email_delivery_failed`, consultar Resend Logs. No se devuelve un ID de correo ni una dirección en la respuesta pública.

## 4. Límites actuales

La solicitud de interés **no es** un informe personalizado. No existe aún una entrega de PDF, PayPal, verificación de pago ni panel administrativo. El envío del PDF completo al propietario descrito en el playbook queda pendiente de una decisión específica sobre datos de salud y controles de acceso. La confirmación por correo y el aviso al responsable usan una clave de idempotencia, pero el reintento automático de entregas fallidas aún no está implementado; una solicitud fallida puede repetirse desde el formulario. La revisión legal y la validación en servicios reales siguen pendientes.
