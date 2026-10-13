# Configuración Google Drive
1. Crear proyecto Google Cloud, habilitar Drive API y service account dedicada con permisos mínimos.
2. Crear carpeta `Apps/ageclarity` en Drive y subcarpetas `base/`, `model/`, `templates/`, `docs/`. Compartir únicamente esa carpeta con email de service account como Editor (si sincroniza) o Reader (runtime).
3. Guardar `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` como secreto server-only y `GOOGLE_DRIVE_FOLDER_ID` con ID real. Evitar json credential en Git.
4. `npm run drive:sync` debe enumerar archivos de drive/, recrear subcarpetas, subir o actualizar por nombre, validar respuesta y SHA-256 contra spec/drive_manifest.json (si actualiza archivos, regenerar manifest en revisión versionada). No subir datos de usuarios.
5. Runtime: enumerar por nombre dentro de folder ID, resolver rutas específicas, comprobar checksum y versión, TTL `DRIVE_CACHE_HOURS=24`, respaldo último snapshot validado, alertar en fallo. No cargar Python como runtime remoto arbitrario: motor TS compilado.
6. Comprobar acceso con privilegios reducidos y simular Drive caído/archivo alterado. Auditar accesos y rotar secretos.
