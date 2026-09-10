# Arquitectura de seguridad

## Controles actuales

- RLS y `tenant_id` para aislamiento.
- Edge Functions para checkout y media; bucket privado y URLs firmadas.
- Validación de MIME, tamaño y firma binaria de imágenes.
- Rate limit, CAPTCHA configurable e idempotencia de checkout.
- CSP, HSTS, `nosniff`, política de permisos y protección de frame en frontend.
- Auditoría y movimientos de inventario.

## Controles requeridos antes de producción

1. MFA para owners/administradores y políticas de recuperación de cuenta.
2. Gestión centralizada de secretos, rotación y mínimo privilegio.
3. WAF/CDN, límites por IP/tenant, alerta de abuso y DDoS runbook.
4. Logs con redacción de PII, Sentry y alertas de incidentes.
5. Backups cifrados, prueba de restauración y objetivos RPO/RTO definidos.
6. Revisión de dependencias, SAST, pruebas de RLS/IDOR y pentest externo antes de beta pagada.

La seguridad no queda aprobada hasta ejecutar estas pruebas en staging con un proyecto real.
