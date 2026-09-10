# StoreOS

**StoreOS** es una plataforma SaaS multi-tenant para crear y operar tiendas online. Fue diseñada y desarrollada por **SoftNanTec**. El tenant `AnimeGeek` es exclusivamente una demostración funcional.

| Ruta | Responsabilidad | Datos o secretos permitidos |
| --- | --- | --- |
| `front/` | React/Vite: tienda pública y panel administrativo | Solo URL y clave publishable de Supabase mediante `VITE_*`. |
| `supabase/migrations/` | Esquema PostgreSQL, RLS, inventario, pedidos y aislamiento por tenant | Migraciones versionadas; nunca credenciales. |
| `supabase/functions/` | API de catálogo, checkout protegido, carga de imágenes y tareas programadas | Secretos solo como variables del entorno de Supabase. |
| `supabase/tests/` | Casos de regresión de aislamiento y permisos | Datos temporales exclusivamente en entorno de prueba. |
| `Plan/` | Decisiones y plan de producto | Sin datos operativos. |

## Flujo seguro

```text
Navegador (publishable key/JWT) → Edge Function → RLS/RPC con privilegio mínimo → PostgreSQL/Storage privado
```

El panel de acceso puede ser visible para todos, pero la autorización se evalúa en cada operación por sesión y membresía de tenant. No es suficiente ocultar botones en el frontend.

Consulta [supabase/README.md](supabase/README.md) para aplicar las migraciones y [supabase/functions/README.md](supabase/functions/README.md) para desplegar el backend.

La definición de negocio y evolución está en [PRD SaaS](Plan/prd_saas_multitienda.md), [dominio y módulos](Plan/ddd_y_modulos_saas.md), [ADR de arquitectura](Plan/adr_001_arquitectura_objetivo.md) y [roadmap de beta](Plan/roadmap_beta_saas.md). El contrato de las Functions está en [supabase/openapi.yaml](supabase/openapi.yaml).

La documentación empresarial consolidada —visión, requisitos, HLD, DDD, ERD, API, LLD, UX, design system, pruebas, despliegue, seguridad, operación y backlog— está en [docs/README.md](docs/README.md).
