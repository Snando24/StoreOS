# Estrategia de pruebas

| Nivel | Objetivo | Estado |
| --- | --- | --- |
| Estático | TypeScript, formato, dependencias y secretos | Parcialmente ejecutado |
| Unitario | Value objects, precios, permisos y transiciones | Pendiente |
| Integración | RPC, RLS, inventario, Storage y Functions | Pendiente |
| E2E | Onboarding, compra, admin y aislamiento tenant | Pendiente |
| Seguridad | Rate limit, CAPTCHA, IDOR, webhooks y carga de archivos | Checklist disponible |
| Rendimiento | Catálogo, checkout, carga y Core Web Vitals | Pendiente |

## Casos bloqueantes de release

- Un tenant nunca lee/escribe datos de otro.
- Doble submit no duplica pedido ni reserva.
- Stock no termina negativo bajo concurrencia.
- Function sin JWT/membresía no puede administrar media o pedidos.
- Restauración de backup y cron de reservas se prueban en staging.

La lista manual vigente está en [tenant_isolation_checklist.md](/C:/Users/andy_/Documents/SoftNanTec/AnimeGeek/supabase/tests/tenant_isolation_checklist.md). Debe convertirse en pruebas automatizadas antes de beta.
