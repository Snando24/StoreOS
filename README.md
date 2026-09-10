# StoreOS

StoreOS es una plataforma SaaS multi-tenant para crear y operar tiendas en línea con aislamiento por cliente, catálogo administrable, pedidos y control de acceso por tenant. Este repositorio incluye la base conceptual, la arquitectura, el frontend y el backend con Supabase.

El tenant `AnimeGeek` funciona como demostración funcional del modelo, no como una instalación específica del producto.

## Visión general

StoreOS está pensado para abordar escenarios en los que varias tiendas comparten una misma base tecnológica pero deben mantener separación clara de:

- datos y catálogo por tenant,
- permisos y accesos de usuarios,
- inventario y precios,
- pedidos y auditoría,
- configuración relevante por marca o negocio.

## Stack principal

- Frontend: React + Vite + TypeScript
- Backend: Supabase (PostgreSQL + Edge Functions + RLS)
- Infraestructura y despliegue: configuración para hosting web y funciones serverless
- Documentación: arquitectura, product requirements, UX, DDD, seguridad y roadmap

## Estructura del repositorio

| Ruta | Descripción |
| --- | --- |
| [front](front) | Aplicación web del cliente y del panel administrativo |
| [supabase](supabase) | Migraciones, Edge Functions, configuración, seed y pruebas |
| [docs](docs) | Documentación de negocio, arquitectura, UX, API y operación |
| [Plan](Plan) | Documento de estrategia, visión y roadmap del producto |
| [scripts](scripts) | Scripts de validación y despliegue |

## Modelo de seguridad

```text
Navegador (publishable key/JWT) -> Edge Function -> RLS/RPC con privilegio mínimo -> PostgreSQL/Storage privado
```

Este proyecto sigue un principio clave: el frontend nunca debe decidir permisos ni datos sensibles. La autorización se valida en cada operación según la sesión y la membresía del tenant.

## Requisitos

- Node.js 20+
- pnpm o npm
- Cuenta de Supabase configurada
- Acceso a proyecto de Supabase con migraciones y funciones desplegadas

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/Snando24/StoreOS.git
cd StoreOS
```

### 2. Configurar el frontend

```bash
cd front
cp .env.example .env.local
npm install
npm run dev
```

Si prefieres pnpm:

```bash
cd front
cp .env.example .env.local
pnpm install
pnpm dev
```

### 3. Configurar Supabase

Sigue la guía de [supabase/README.md](supabase/README.md) para:

- aplicar migraciones,
- cargar semillas si corresponde,
- desplegar las Edge Functions,
- revisar límites de seguridad y aislamiento por tenant.

### 4. Variables de entorno

El frontend solo debe usar valores públicos, típicamente con prefijo `VITE_*`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_TENANT_SLUG=animegeek
```

> No se deben incluir secretos del backend ni claves de servicio en el frontend.

## Casos de uso principales

- tiendas multi-tenant bajo una misma base técnica,
- administración de catálogo por tenant,
- gestión de pedidos y reservas,
- aislamiento de datos por organización y usuario,
- patrón extensible para otros segmentos de negocio.

## Documentación

La referencia técnica y de negocio está distribuida en los siguientes documentos:

- [docs/README.md](docs/README.md) — índice de documentación consolidada
- [Plan/prd_saas_multitienda.md](Plan/prd_saas_multitienda.md) — PRD del producto
- [Plan/ddd_y_modulos_saas.md](Plan/ddd_y_modulos_saas.md) — dominio y módulos
- [Plan/adr_001_arquitectura_objetivo.md](Plan/adr_001_arquitectura_objetivo.md) — decisiones de arquitectura
- [Plan/roadmap_beta_saas.md](Plan/roadmap_beta_saas.md) — hoja de ruta
- [supabase/openapi.yaml](supabase/openapi.yaml) — contrato de APIs y funciones
- [supabase/tests/tenant_isolation_checklist.md](supabase/tests/tenant_isolation_checklist.md) — checklist de seguridad y aislamiento

## Estado del proyecto

Este repositorio representa una base madura de arquitectura y producto para una solución SaaS orientada a tiendas online, con foco en:

- escalabilidad técnica,
- seguridad por diseño,
- separación por tenant,
- documentación ejecutable,
- evolución desde una demo funcional hacia producción.

## Contribución

Los cambios deben ir acompañados de:

- documentación relevante si se altera la arquitectura o los procesos,
- validación del impacto en seguridad,
- pruebas de aislamiento por tenant cuando se modifican datos o permisos,
- actualización de la documentación asociada cuando cambien reglas de negocio o despliegue.

## Licencia

Este proyecto se encuentra bajo la licencia definida por el equipo de desarrollo. Consulta los archivos del repositorio para confirmar la política aplicada.
