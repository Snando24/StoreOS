# Roadmap de ejecución — de pre-MVP a beta SaaS

## Etapa actual: Foundation / Release 0 incompleto

Existe UI Vite, migraciones multi-tenant y cuatro Edge Functions, pero no hay entorno Supabase desplegado ni flujo SaaS completo. No se debe declarar beta ni aceptar pagos reales todavía.

## Hito 0 — Entorno verificable

**Salida:** staging reproducible y seguro.

- Crear proyectos Supabase separados para desarrollo, staging y producción.
- Aplicar migraciones; desplegar Functions, secretos, CAPTCHA y cron.
- Automatizar pruebas de aislamiento, checkout, reservas y permisos en CI.
- Configurar backup, alertas, logs estructurados, Sentry y analítica sin capturar datos sensibles.
- Publicar política de privacidad, términos, retención y canal de incidentes tras revisión responsable.

## Hito 1 — Piloto operativo

**Salida:** cinco comercios piloto pueden publicar y gestionar pedidos sin datos simulados.

- Reemplazar `mockBackend.ts` por APIs de pedidos, inventario, clientes y configuración.
- Implementar onboarding, miembros, límites de prueba y publicación de tienda.
- Operar catálogo, inventario, confirmación de pago, preparación y cancelación desde UI.
- Ejecutar compras de prueba y revisión de soporte con cada piloto.

## Hito 2 — Storefront listo para adquisición

**Salida:** storefront por tenant indexable, rápido y medible.

- Migrar páginas públicas a Next.js de forma gradual conforme ADR-001.
- Añadir subdominios, verificación de dominios propios, SEO, sitemap y analítica de embudo.
- Medir Core Web Vitals, activación y conversión; corregir los mayores abandonos.

## Hito 3 — Beta pagada controlada

**Salida:** planes y límites aplicados por servidor; pagos de suscripción bajo control.

- Modelar `subscriptions`, `entitlements`, uso y estados de cuenta.
- Integrar facturación/proveedor de suscripción con webhooks firmados e idempotentes.
- Habilitar dominios propios solo con verificación DNS y recuperación segura.

## Después de validación

Pagos de compradores, envíos, notificaciones, CSV, marketing, reportes y módulo IA se priorizan por evidencia de pilotos, no por amplitud de funcionalidades.
