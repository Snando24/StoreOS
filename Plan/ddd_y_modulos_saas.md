# Dominio, módulos y fronteras SaaS

Este documento evita que el esquema de base de datos se convierta en la arquitectura. Cada módulo es dueño de sus reglas y publica contratos; ningún componente React consulta tablas internas de otro módulo.

## Contextos delimitados

| Contexto | Responsabilidad | Agregados principales | Eventos relevantes |
| --- | --- | --- | --- |
| Identidad y acceso | Sesión, perfil, membresías y roles. | Usuario, Membresía | `MemberInvited`, `MemberRoleChanged` |
| Tenant y suscripción | Tienda, dominio, plan, límites y estado. | Tenant, Subscription | `StoreProvisioned`, `PlanChanged`, `DomainVerified` |
| Catálogo | Producto, variante, media, categoría y atributos. | Producto | `ProductPublished`, `ProductChanged` |
| Inventario | Disponibilidad, reserva y movimientos inmutables. | Inventario de variante | `StockAdjusted`, `StockReserved`, `ReservationReleased` |
| Pedidos | Checkout, snapshots, transición y fulfillment. | Pedido | `OrderCreated`, `PaymentConfirmed`, `OrderFulfilled` |
| Pagos | Método, intento, webhook y conciliación. | Pago | `PaymentAuthorized`, `PaymentFailed`, `Refunded` |
| Envíos | Dirección, tarifa, envío y tracking. | Envío | `ShipmentCreated`, `ShipmentDelivered` |
| Growth/IA | Contenido, campañas y sugerencias. | Campaña, Tarea IA | `ContentGenerated`, `CampaignSent` |

## Reglas de negocio no negociables

- Todo agregado comercial pertenece a un único `tenant_id`.
- El precio, la publicación y el stock se vuelven a validar dentro de la transacción de pedido.
- Una reserva no reduce stock físico; aumenta stock reservado y vence de forma idempotente.
- Un `order_item` es un snapshot inmutable: no se recalcula desde el producto actual.
- Los cambios de estado solo ocurren mediante comandos permitidos; no por un `UPDATE` del navegador.
- La autorización se determina por tenant y rol en servidor/RLS, nunca por una opción visible de UI.
- La IA produce propuestas revisables, jamás cambios publicados o cobros automáticos sin una acción humana explícita.

## Propiedad de datos

| Módulo | Tablas actuales | Estado |
| --- | --- | --- |
| Identidad | `profiles`, `tenant_memberships` | Implementado parcialmente |
| Tenant | `tenants`, `tenant_settings`, `tenant_domains` | Implementado; falta verificación de dominio y plan/entitlements |
| Catálogo | `products`, variantes, imágenes, marcas, categorías, atributos | Implementado base |
| Inventario | `inventory_items`, movimientos, reservas | Implementado base |
| Pedidos | `customers`, `orders`, items, historial, intentos de pago | Implementado base |
| Suscripción | — | Pendiente |
| Pagos automáticos/envíos | Estructuras básicas de intento/dirección | Pendiente de integración |
| IA, marketing y reportes | — | Pendiente |

## Comandos que deben existir antes de beta

1. `provisionTenant` — usuario verificado, entitlement de prueba y auditoría.
2. `createProduct` / `publishProduct` — membresía, límites del plan y media validada.
3. `adjustInventory` — motivo obligatorio y movimiento inmutable.
4. `createOrder` — idempotencia, precio/stock servidor y reserva.
5. `confirmManualPayment`, `advanceOrder`, `cancelOrder` — transiciones autorizadas.
6. `inviteMember`, `changeMemberRole`, `removeMember` — solo owner/admin según política.
7. `configureStore` y `publishStore` — validan requisitos mínimos antes de exponer el storefront.

Los comandos 1–5 existen total o parcialmente como RPC/Functions. Los comandos 6–7 son bloqueadores funcionales de la beta SaaS.
