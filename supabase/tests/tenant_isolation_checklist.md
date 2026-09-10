# Lista de regresión de aislamiento y seguridad

Ejecutar en un proyecto de staging con dos tenants, `tenant-a` y `tenant-b`, y tres usuarios: propietario de A, operador de B y visitante anónimo. No ejecutar contra producción.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Catálogo público | Invocar `catalog` con cada slug. | Solo devuelve productos publicados de ese tenant; no expone `storage_path`, usuarios, pedidos ni inventario reservado. |
| Storage directo | Con clave anon/JWT, intentar `upload`, `update` y `remove` en `tenant-assets`. | Todas las operaciones son denegadas. |
| URL de imagen | Pedir la URL pública del bucket e intentar abrirla. | No existe URL pública; el catálogo entrega URL firmada de vida corta. |
| Checkout abusivo | Repetir seis peticiones válidas desde la misma huella en menos de diez minutos. | La sexta responde `429`; no se crea pedido adicional. |
| CAPTCHA productivo | Desplegar con `REQUIRE_TURNSTILE=true` y sin token válido. | `create-order` responde `403`; sin secreto también debe rechazar. |
| Cruce de tenant | Usuario de B llama `tenant_create_product` con slug de A y sube imagen al producto de A. | Ambas acciones responden `403`/RPC denegado y no modifican A. |
| Admin visible | Visitante abre la ruta de admin y llama funciones administrativas sin JWT. | Puede ver login, pero no obtener datos ni realizar cambios. |
| Pedidos | Usuario de A intenta leer o actualizar pedidos de B mediante REST/RPC. | RLS devuelve cero filas o `403`; no hay cambios. |
| Reserva vencida | Crear una reserva, avanzar el tiempo o ajustar su vencimiento en staging, invocar cron. | Reserva se libera una única vez y `reserved_stock` no queda negativo. |
| Encabezados | Desplegar `front` y revisar respuesta HTTP. | CSP, HSTS, `nosniff`, `DENY`, referrer y permissions policy presentes. |

Registrar el resultado, fecha, versión de migración y evidencia de cada prueba antes de cada release. Los casos de API pueden automatizarse con un runner que use tres JWT de staging; nunca se deben guardar esos tokens en el repositorio.
