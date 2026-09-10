# DDD — Modelo de dominio

| Contexto | Aggregate root | Responsabilidad | Eventos de dominio |
| --- | --- | --- | --- |
| Identity | User / Membership | Sesión, rol y acceso de miembros. | MemberInvited, RoleChanged |
| Tenant | Tenant | Tienda, dominio, plan y estado. | StoreProvisioned, DomainVerified |
| Catalog | Product | Producto, variante, media, categoría y atributos. | ProductPublished, ProductChanged |
| Inventory | VariantInventory | Stock, reserva y ledger. | StockAdjusted, StockReserved, ReservationReleased |
| Orders | Order | Checkout, snapshot y transiciones. | OrderCreated, PaymentConfirmed, OrderCancelled |
| Payments | Payment | Intento, webhook, conciliación y reembolso. | PaymentAuthorized, PaymentFailed |
| Shipping | Shipment | Dirección, tarifa, tracking y entrega. | ShipmentCreated, ShipmentDelivered |
| Billing | Subscription | Plan, entitlement, consumo y factura. | PlanChanged, InvoiceIssued |
| Content | StoreTheme | Tema, páginas y bloques publicados. | ThemePublished, PagePublished |
| Growth/AI | Campaign / AIJob | Contenido, campañas y sugerencias revisables. | ContentGenerated, CampaignSent |

## Value objects

`TenantId`, `Money`, `Currency`, `Sku`, `Email`, `Phone`, `Domain`, `Quantity`, `OrderNumber`, `IdempotencyKey` y `Role` deben validarse en borde y dominio.

## Invariantes

- Un dato comercial pertenece a un único tenant.
- Una variante es fuente de precio y stock; el producto no lo es.
- Un pedido conserva snapshots inmutables.
- Ninguna transición de pedido ocurre fuera de comandos autorizados.
- IA produce borradores, no cambios publicados automáticamente.
