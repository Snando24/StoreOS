# PRD — Plataforma SaaS de comercio para pequeñas tiendas

**Estado:** aprobado para diseño y MVP  
**Producto:** plataforma multi-tenant para crear, operar y publicar una tienda online sin conocimientos técnicos.  
**Mercado inicial:** negocios pequeños de Perú que venden por redes sociales o mensajería; el diseño no queda limitado a productos geek.

## 1. Problema y propuesta de valor

Los pequeños comercios administran catálogo, stock y pedidos entre mensajes, hojas de cálculo y enlaces de pago. Pierden ventas por falta de catálogo confiable, sobreventa y seguimiento manual.

> Crea y publica una tienda profesional en menos de 10 minutos; controla productos, stock y pedidos desde un solo panel.

La diferenciación inicial no es una IA genérica: es un flujo local y simple para convertir ventas de redes sociales en pedidos trazables, con reserva de stock y pagos manuales. La IA se incorpora después como acelerador de contenido, no como dependencia del checkout.

## 2. Cliente ideal y usuarios

| Segmento | Dolor principal | Prioridad |
| --- | --- | --- |
| Emprendedor de 1–3 personas | Vende por WhatsApp/Instagram y no controla stock. | Primario MVP |
| Pequeña tienda de 4–15 personas | Necesita operadores, catálogo consistente y seguimiento de pedidos. | Secundario MVP |
| Tienda mediana | Requiere integraciones, multialmacén y reportes. | Después de validación |

Roles: propietario (facturación, miembros y configuración), administrador (catálogo y pedidos), operador (operación diaria) y comprador invitado. El acceso al panel puede ser visible, pero solo una membresía activa autoriza acciones.

## 3. Oferta comercial inicial

Los límites son configuración de *entitlements*, no condicionales dispersos en la interfaz.

| Capacidad | Prueba/Free | Plan Pro |
| --- | --- | --- |
| Duración | Prueba de 14 días; el free permanente se valida con costos reales. | Suscripción activa |
| Productos publicados | 25 | Límite comercial configurable |
| Usuarios de tienda | 1 | Múltiples según contrato |
| Subdominio de plataforma | Sí | Sí |
| Dominio propio | No | Sí |
| Checkout y pago manual | Sí | Sí |
| Branding, automatizaciones, IA y reportes | No | Por paquetes habilitados |

**Decisión pendiente de negocio:** precio, moneda de cobro, impuestos, proveedor de facturación y política de cancelación. Ninguno se debe codificar hasta validarlo con clientes piloto y finanzas.

## 4. Alcance del MVP comercial

### Incluye

- Registro con correo verificado y creación de tenant.
- Onboarding: nombre/slug, rubro, identidad básica, método de entrega/pago manual, producto inicial y publicación.
- Storefront público por subdominio o slug: catálogo, ficha, carrito y checkout invitado.
- Productos, variantes, fotos privadas, precio, categorías, atributos flexibles e inventario.
- Pedidos idempotentes, reserva temporal, confirmación manual, preparación, envío/cancelación y trazabilidad.
- Gestión de miembros por tenant y controles de seguridad/aislamiento.

### No incluye en el MVP

- Pasarela de pago, reembolsos o facturación electrónica.
- Cálculo de envíos por operador logístico.
- Marketplace, multialmacén, campañas, cupones, CRM, BI avanzado o app móvil.
- Generación con IA, chatbot o recomendaciones.

## 5. Flujo crítico y requisitos de aceptación

```text
Registro → verificar correo → crear tienda → configurar identidad y pago
→ crear producto → publicar → compartir enlace → pedido invitado
→ confirmar pago → preparar/despachar → auditar inventario
```

El MVP está listo para piloto cuando un propietario puede completar ese flujo sin SQL, soporte técnico ni datos simulados; un visitante puede comprar; y un operador no puede leer ni cambiar datos de otro tenant.

## 6. Métricas de validación

- Activación: porcentaje de tiendas que publican su primer producto en 10 minutos.
- Valor: porcentaje de tiendas con primer pedido real en siete días.
- Operación: pedidos creados con stock negativo = 0.
- Fiabilidad: error de checkout menor al 1% de intentos válidos.
- Retención: tiendas activas semanalmente y pedidos por tienda activa.
- Seguridad: cero accesos cross-tenant confirmados; toda alerta P0 se investiga antes de escalar ventas.

## 7. Riesgos y decisiones previas a beta

1. Validar con 5–10 comercios que el onboarding, pago manual y límites de plan resuelven un problema real.
2. Definir responsable legal y de privacidad antes de procesar datos personales reales.
3. No habilitar dominios propios hasta disponer de verificación DNS, TLS y prevención de toma de dominio.
4. No cobrar ni automatizar pagos sin webhooks firmados, conciliación, reintentos e idempotencia.
