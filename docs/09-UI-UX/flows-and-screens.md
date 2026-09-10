# UX — Flujos y pantallas

La dirección visual y los flujos de tienda geek existentes se conservan en [Plan UX/UI](/C:/Users/andy_/Documents/SoftNanTec/AnimeGeek/Plan/plan_diseno_ux_ui_tienda_geek.md). Este documento amplía la plataforma SaaS.

## Flujos prioritarios

1. **Adquisición:** Landing → precios → FAQ/contacto → registro/login.
2. **Activación:** cuenta → verificar correo → nombre/slug → identidad → tema → primer producto → pago/entrega → publicar.
3. **Compra:** inicio → categoría/búsqueda → ficha → carrito → checkout → confirmación → seguimiento.
4. **Operación:** dashboard → pedidos → detalle/timeline → confirmar pago → preparar/despachar/cancelar.
5. **Administración:** configuración → dominio/SEO/impuestos/envíos → usuarios/roles → webhooks/API.

## Inventario de pantallas

| Área | Pantallas MVP | Posterior |
| --- | --- | --- |
| Landing | inicio, precios, FAQ, contacto, login, registro | casos de cliente, blog |
| Onboarding | cuenta, verificación, tienda, subdominio, identidad, producto, publicar | tema, logo IA, dominio propio |
| Dashboard | resumen, productos, pedidos, clientes, configuración | marketing, IA, reportes |
| Builder | — | editor, bloques, vista previa, publicar |
| Catálogo | lista, nuevo, editar, media, inventario | duplicar, importar/exportar |
| Pedidos | lista, detalle, estados, notas | reembolso, fulfillment externo |
| Billing | — | plan, suscripción, método, facturas |

## Criterios UX

- Mobile-first, WCAG AA, navegación por teclado y estados de error claros.
- No esconder autorización tras la UI: una pantalla visible no implica permiso.
- Cada acción irreversible tiene confirmación, feedback y trazabilidad.
- No diseñar pantallas de módulos sin decisión de negocio y contrato de datos.
