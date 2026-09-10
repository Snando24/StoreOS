# Contratos API

La especificación ejecutable está en [supabase/openapi.yaml](/C:/Users/andy_/Documents/SoftNanTec/AnimeGeek/supabase/openapi.yaml). Cada endpoint declara `x-status: implemented` o `planned`; UI no puede consumir contratos planificados.

## Implementados

| Endpoint | Autorización | Finalidad |
| --- | --- | --- |
| `GET /health` | Pública | Verifica plataforma sin PostgreSQL. |
| `POST /catalog` | Pública | Catálogo publicado y URLs firmadas. |
| `POST /create-order` | Pública protegida | Checkout, rate limit y reserva. |
| `POST /admin-upload-product-image` | JWT + membresía | Carga validada de media. |
| `POST /expire-reservations` | Secreto cron | Mantenimiento de reservas. |

## Convenciones

- Versionar API antes de cambios incompatibles.
- Usar UUID, `Idempotency-Key` o campo equivalente para comandos repetibles.
- Errores normalizados: `invalid_request`, `forbidden`, `not_found`, `conflict`, `rate_limited`.
- Webhooks futuros: firma, timestamp, reintento, idempotencia y auditoría obligatorios.
