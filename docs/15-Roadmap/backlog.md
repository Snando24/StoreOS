# Backlog de ejecución — Vertical slices

## Regla de orden

Un flujo no puede declararse funcional sin su UI, API/command, autorización, datos mínimos, telemetría y pruebas en **staging**. La infraestructura de producción no se habilita todavía, pero staging, backups de staging, logs y CI básico son prerrequisitos del primer piloto.

La base de datos sigue siendo el último paso de la preparación de plataforma: primero se valida estructura y Functions; después se revisa `db push --dry-run`; finalmente se aplican las migraciones **solo a staging**. No se espera hasta el final del producto para tener el esquema mínimo.

## Slice 0 — Plataforma de staging

**Objetivo:** entorno reproducible, sin tráfico comercial.

- Inicializar Git y protección de ramas.
- Crear proyecto Supabase de staging, autenticar CLI y definir secretos.
- Desplegar `health`, luego Functions sin exponer tráfico.
- Revisar migraciones con dry-run y aplicar el esquema mínimo en staging.
- Configurar logs, backup de staging, CI de build/TypeScript y prueba de aislamiento.

**Salida:** `GET /health` responde, migraciones están registradas en staging y no hay secretos en repositorio.

## Slice 1 — Registro a dashboard

```text
Registro → verificar correo → login → crear tenant/store → owner → dashboard vacío
```

- Registro, confirmación de email y recuperación segura.
- Comando `provisionTenant` con límites de prueba y auditoría.
- Membership owner creada atómicamente.
- Dashboard protegido que muestra nombre/estado de la tienda, sin mocks.

**Salida:** un usuario nuevo crea una única tienda de prueba y no puede acceder a datos ajenos.

## Slice 2 — Producto publicado

```text
Crear producto → variante/stock/media → publicar → visible en catálogo
```

- CRUD de producto y variante con autorización de tenant.
- Carga de media validada y almacenamiento privado.
- Límite de plan aplicado en servidor.
- Catálogo público de productos publicados por slug/subdominio.

**Salida:** el owner publica un producto y un visitante lo ve sin exponer datos internos.

## Slice 3 — Compra a operación

```text
Carrito → checkout invitado → pedido/reserva → operador confirma → historial
```

- Carrito persistente y checkout idempotente.
- Reserva de inventario, pago manual y cron de vencimiento.
- Panel real de lista/detalle de pedidos; eliminar `mockBackend.ts`.
- Transiciones de pago, preparación, envío y cancelación con auditoría.

**Salida:** un pedido de prueba pasa de checkout a estado final sin SQL manual ni stock negativo.

## Slice 4 — Configuración y publicación de tienda

```text
Identidad → colores/tema mínimo → subdominio → publicar → visitante ve cambios
```

- Nombre, logo, colores y tema inicial con Header, Hero, Productos y Footer.
- Orden/revisión de bloques y publicación atómica.
- Resolución por subdominio; dominio propio solo con verificación DNS posterior.

**Salida:** cada tenant publica una apariencia básica sin afectar otra tienda.

## Slice 5 — Entitlements y facturación SaaS

```text
Elegir plan → cobrar suscripción → webhook firmado → activar límites
```

- Plan, suscripción, factura y consumo.
- Adaptador de proveedor, webhooks firmados e idempotentes.
- Renovación, cancelación y degradación segura de capacidades.

**Salida:** límites y capacidades se aplican en servidor tras un evento de pago verificable.

## Posterior a pilotos

IA, builder avanzado, marketing, cupones, reportes, pagos de compradores, envíos externos y apps se priorizan solo con evidencia de clientes.

## Definition of Ready

Una tarea entra a desarrollo solo si tiene requisito, contexto DDD, contrato/datos, criterio de aceptación, política de autorización, telemetría y prueba definida.

## Definition of Done

Código revisado, pruebas verdes, contrato actualizado, migración segura si aplica, monitoreo incluido, documentación actualizada y verificado en staging.
