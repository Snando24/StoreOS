# Backend Supabase

Este directorio es el backend del servicio: modelo de datos, RLS, funciones de dominio y Edge Functions. El frontend no contiene ni debe contener una clave de servicio.

## Aplicación de migraciones

Aplicar en orden ascendente:

1. `202608010001_release0_foundation.sql`
2. `202608010002_create_order_rpc.sql`
3. `202608010003_secure_order_operations.sql`
4. `202608010004_multitenant_saas.sql`
5. `202608010005_security_hardening.sql`
6. `202608010006_slice1_onboarding.sql`
7. `202608010007_tenant_product_management.sql`
8. `202608010008_tenant_product_editing.sql`

Ejecutar `seed.sql` solamente en desarrollo o staging. No usarlo sobre un catálogo real, porque modifica precios y stock de demostración.

## Límites de acceso

| Operación | Vía autorizada |
| --- | --- |
| Ver catálogo | Function `catalog`; expone solo productos publicados y URLs firmadas. |
| Crear pedido | Function `create-order`; valida payload, CAPTCHA y rate limit. |
| Cargar imagen | Function `admin-upload-product-image` con JWT y membresía. |
| Liberar reservas | Function `expire-reservations`, protegida por secreto de cron. |
| Crear y administrar catálogo | RPC con JWT, RLS y membresía del tenant. |
| Gestionar productos | RPC de CRUD, inventario y cambio auditado de estado; el archivado conserva trazabilidad. |

`tenant-assets` es privado. Se eliminaron las escrituras directas desde navegador y el acceso público a las tablas de catálogo. El backend aplica precio, stock, reservas e identidad; el cliente no decide esos valores.

## Frontend

1. Copiar [`.env.example`](../front/.env.example) a `front/.env.local`.
2. Configurar URL de proyecto, clave **publishable** y `VITE_TENANT_SLUG`.
3. No añadir una Secret Key, `SUPABASE_SERVICE_ROLE_KEY`, secretos de cron ni claves de CAPTCHA a Vite.

Sin configuración, la interfaz conserva datos de demostración. Con ella, consume las Edge Functions de catálogo y checkout.

## Aislamiento SaaS

- Los datos comerciales llevan `tenant_id`; RLS y las funciones comprueban membresía para cada lectura operativa y escritura.
- La ruta de administración puede ser visible para todos, pero una sesión sin membresía no puede leer ni modificar datos de tienda.
- Cada tenant crea sus productos, categorías, marcas y atributos; el modelo no está limitado a coleccionables.
- `product_attribute_definitions` y `product_attribute_values` permiten adaptar el catálogo a cualquier rubro sin cambiar el esquema.

Consulta [functions/README.md](functions/README.md) para secretos, despliegue y cron, y [tests/tenant_isolation_checklist.md](tests/tenant_isolation_checklist.md) para la regresión de seguridad previa a un release.
