# Estrategia de despliegue

## Entornos

| Entorno | Propósito | Datos |
| --- | --- | --- |
| Desarrollo | Cambios locales y datos sintéticos | Nunca PII real |
| Staging | Integración, seguridad y UAT | Datos anonimizados o sintéticos |
| Producción | Clientes reales | Acceso mínimo y auditoría |

## Orden seguro para iniciar ejecución

1. Validar estructura con `scripts/validate-supabase-structure.ps1`.
2. Autenticar Supabase, definir project ref y cargar secretos locales.
3. Desplegar `health`; comprobar respuesta HTTP.
4. Desplegar Functions restantes sin abrir tráfico comercial.
5. **Último paso de preparación de plataforma:** revisar con `db push --dry-run`, aplicar migraciones y verificar RLS en staging.
6. Activar cron, frontend de staging, smoke tests y rollback documentado.

No se inicia un vertical slice funcional sin el esquema mínimo aplicado en staging. Producción permanece bloqueada hasta completar pruebas, observabilidad, backups, revisión y beta controlada.

Los scripts disponibles están en [scripts](/C:/Users/andy_/Documents/SoftNanTec/AnimeGeek/scripts). Producción requiere Git, CI/CD, revisión y aprobación; no despliegues manuales no auditables.
