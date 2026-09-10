# ADR-001 — Arquitectura objetivo y transición

**Estado:** aceptada para el MVP; migración de storefront pendiente.  
**Decisión:** mantener Supabase como backend transaccional y adoptar una arquitectura modular. El frontend Vite actual se conserva para validar el back-office; el storefront público migrará a Next.js antes de beta abierta para obtener SSR, SEO, metadatos por tienda y caché controlada.

## Motivo

El plan 2.0 define Next.js, mientras que el repositorio actual utiliza React/Vite. Un SPA puede validar operaciones, pero no cumple bien la meta de descubrimiento orgánico, páginas indexables ni storefronts de dominios múltiples.

## Arquitectura objetivo

```text
Navegador → CDN/WAF → Next.js (storefront + BFF) → Supabase Edge Functions/RPC → PostgreSQL
                                      └──────────→ Storage privado + URLs firmadas
Servicios externos: pagos, correo/WhatsApp, analítica, Sentry y DNS
```

- **No microservicios en MVP.** Módulos lógicos, contratos versionados y eventos de auditoría primero.
- **No API Gateway propio ni Spring Boot aún.** Añadirlos ahora aumenta operación sin resolver una métrica demostrada.
- **Redis, cola y workers** se introducen solo para jobs de alto volumen: notificaciones, webhooks, indexación y tareas IA.
- **Edge Functions** validan HTTP público; las RPC transaccionales conservan invariantes de pedidos/inventario.

## Consecuencias y tareas

1. Crear proyecto Next.js en una rama de migración y mover primero catálogo, ficha y páginas de tenant.
2. Mantener contratos API independientes de React para que Vite y Next convivan temporalmente.
3. No migrar checkout/admin hasta que catálogo SSR tenga pruebas de regresión, Core Web Vitals y preview desplegado.
4. Eliminar la SPA de producción solo tras paridad funcional; no hacer una reescritura big-bang.
