# Modelo operativo

## Observabilidad

- Métricas: activación, pedidos, tasa de error checkout, latencia, stock negativo, jobs fallidos y acceso denegado.
- Logs: correlación por request/order/tenant; no registrar tarjetas, tokens ni PII innecesaria.
- Alertas: error de checkout, cron sin éxito, backups fallidos, tasa de 4xx/5xx y anomalías cross-tenant.

## Runbooks mínimos

| Evento | Acción inicial |
| --- | --- |
| Checkout falla | Desactivar tráfico afectado, revisar Function/RPC, preservar idempotency keys. |
| Reserva no liberada | Pausar confirmaciones afectadas, ejecutar job controlado, auditar movimientos. |
| Sospecha cross-tenant | Revocar sesión/credenciales, preservar logs, aislar tenant, investigar como P0. |
| Secreto expuesto | Revocar/rotar, revisar accesos y desplegar nueva configuración. |
| Fallo de deploy | Rollback de artefacto, no de datos sin plan de migración. |

Definir SLA, responsable on-call, RPO/RTO y proceso de soporte antes de clientes de pago.
