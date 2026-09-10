# StoreOS Roadmap v1.0 — trazabilidad de ejecución

Fuente: `StoreOS_Roadmap_v1.0.md`, proporcionado por producto el 2026-08-01.

## Estado actual

**Versión activa: v0.1 Foundation.** La plataforma está en staging. Una función solo se declara terminada tras prueba manual y criterios de seguridad, no al existir una pantalla.

| Versión / épica | Estado | Evidencia y siguiente cierre |
| --- | --- | --- |
| v0.1 · Autenticación | En curso | Registro, login/logout, sesión, verificación, reenvío y recuperación de contraseña implementados. Pendiente: SMTP propio y pruebas completas de los correos. |
| v0.1 · Tenant | En curso | Tenant, slug, owner, configuración base, auditoría y RLS implementados. Pendiente: país, idioma, zona horaria, identidad editable y dominio propio. |
| v0.1 · Dashboard | En curso | Dashboard protegido y acciones de alta básicas. Pendiente: métricas reales y enlaces de operación. |
| v0.1 · Productos / catálogo | En curso | El owner crea, lista, edita datos y variantes, publica, despublica y archiva productos en su tenant mediante RPC autorizada; las imágenes usan Function con JWT y membresía. Un catálogo público por tenant está disponible en `?store=slug`, aislado del demo. Pendiente: eliminar/reordenar imágenes, identidad visual y dominio propio. |
| v0.2 · Checkout, pedidos, clientes, inventario | Parcial técnico | Checkout, reserva e inventario se validaron para AnimeGeek. Pendiente: panel de pedidos real, clientes y eliminar mocks. |
| v0.3 · Constructor, dominio, reportes, cupones | No iniciado | No avanzar antes de cerrar v0.1 y v0.2. |
| v0.4 · Comercial | No iniciado | Pagos, suscripciones, planes y facturación requieren proveedor y reglas de negocio. |
| v0.5 · Growth | No iniciado | IA, marketing, SEO y analytics posteriores al flujo transaccional estable. |
| v1.0 · Plataforma estable | No iniciada | Requiere seguridad, operaciones, pruebas, DevOps y soporte humano verificables. |

## Orden de ejecución inmediato

1. Configurar SMTP propio y URL de autenticación; probar registro, verificación, recuperación y reenvío.
2. Completar configuración base del tenant y rol propietario.
3. Completar la gestión de imágenes por tenant (eliminar y reordenar); el CRUD de datos y variantes, publicación y archivado seguro ya están implementados.
4. Conectar panel de pedidos, clientes e inventario al backend real; retirar mocks. El checkout de tiendas nuevas permanece bloqueado hasta tener configuración de pagos por tenant.
5. Recién entonces abordar constructor visual y dominio.

## Reglas de alcance

- `AnimeGeek` es un tenant demo, nunca una dependencia del producto StoreOS.
- Las capacidades comerciales se autorizan en backend; la UI no basta.
- IA y chat de soporte se conectan a proveedor externo solo con rate limit, política de datos, auditoría y escalamiento humano definidos.
