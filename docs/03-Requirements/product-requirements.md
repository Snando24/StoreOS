# Requisitos de producto

## Flujo principal MVP

```text
Registro → verificación de correo → crear tienda → configurar identidad
→ crear producto → publicar → compartir enlace → checkout invitado
→ confirmar pago → preparar/despachar → auditar inventario
```

## Prerrequisito de ejecución

Antes de implementar o validar un flujo funcional, el entorno de staging debe tener autenticación, esquema mínimo, RLS, secretos y pruebas de aislamiento activos. La base de datos se aplica al final de la preparación de plataforma, no al final de todos los sprints.

## Requisitos funcionales

| ID | Requisito | Prioridad |
| --- | --- | --- |
| FR-01 | Un usuario verificado crea y administra un tenant. | MVP |
| FR-02 | Una tienda gestiona productos, variantes, imágenes y atributos. | MVP |
| FR-03 | Stock, reservas y movimientos se actualizan transaccionalmente. | MVP |
| FR-04 | Un comprador invitado crea pedido idempotente. | MVP |
| FR-05 | Operadores avanzan o cancelan pedidos con auditoría. | MVP |
| FR-06 | Cada tenant configura marca, subdominio y métodos manuales. | MVP |
| FR-07 | Planes y entitlements bloquean capacidades por servidor. | Beta pagada |
| FR-08 | Dominio propio se habilita solo tras verificación DNS. | Beta pagada |

## Requisitos no funcionales

- RLS sin acceso cross-tenant.
- Operaciones críticas atómicas e idempotentes.
- Sin secretos privados en cliente.
- Catálogo público rápido y páginas indexables antes de beta abierta.
- Telemetría, backups, pruebas y alertas antes de procesar operaciones reales.
