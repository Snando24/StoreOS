# ERD conceptual

Este es el modelo objetivo; las tablas de suscripción, tema, builder, pago y envío se crean solo al llegar a su épica. Las migraciones actuales están en `supabase/migrations` y siguen siendo la fuente física del esquema.

```mermaid
erDiagram
  USER ||--o{ MEMBERSHIP : belongs
  TENANT ||--o{ MEMBERSHIP : has
  TENANT ||--|| STORE : owns
  TENANT ||--o{ PRODUCT : owns
  PRODUCT ||--o{ VARIANT : contains
  PRODUCT ||--o{ MEDIA : has
  VARIANT ||--|| INVENTORY : tracks
  VARIANT ||--o{ INVENTORY_MOVEMENT : records
  CUSTOMER ||--o{ ADDRESS : owns
  TENANT ||--o{ CUSTOMER : serves
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--o{ ORDER_ITEM : snapshots
  VARIANT ||--o{ ORDER_ITEM : references
  ORDER ||--o{ PAYMENT : has
  ORDER ||--o{ SHIPMENT : has
  TENANT ||--|| SUBSCRIPTION : billed
  PLAN ||--o{ SUBSCRIPTION : defines
  TENANT ||--o{ AUDIT_LOG : records
```

## Reglas físicas

- `tenant_id` obligatorio en entidades comerciales.
- Dinero en enteros y moneda ISO.
- Claves únicas por tenant para slug/SKU cuando corresponda.
- Índices basados en consultas reales y `EXPLAIN ANALYZE`.
- Migraciones versionadas, reversibles cuando sea viable y aplicadas al final del flujo de plataforma.
