# Edge Functions de seguridad

Estas funciones constituyen el backend HTTP. El navegador no crea pedidos por RPC ni escribe directamente en Storage.

| Función | Acceso | Responsabilidad |
| --- | --- | --- |
| `health` | Pública | Comprueba que la plataforma de Functions está desplegada; no consulta base de datos. |
| `catalog` | Público | Catálogo publicado de un tenant y URLs firmadas para imágenes privadas. |
| `create-order` | Público protegido | Valida el payload, Turnstile, límite de peticiones e identidad antes de crear un pedido. |
| `admin-upload-product-image` | JWT requerido | Comprueba sesión, membresía, MIME, firma binaria y tamaño antes de guardar una imagen. |
| `expire-reservations` | Secreto de cron | Libera reservas vencidas; nunca se expone al navegador. |

## Secretos

Configurar solo en Supabase; nunca en Vite ni en archivos `.env` versionados:

```text
TURNSTILE_SECRET=<secreto-de-cloudflare-turnstile>
REQUIRE_TURNSTILE=true
CRON_SECRET=<valor-aleatorio-largo>
```

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` y `SUPABASE_SECRET_KEYS` viven en el entorno de las Functions. La Secret Key solo puede existir dentro de esa capa; las variables legacy quedan solo como compatibilidad temporal.

## Despliegue de Functions (sin migrar base de datos)

1. Copiar `supabase/.env.functions.example` a `supabase/.env.functions.local` y definir secretos reales.
2. Ejecutar `npx supabase login` **o** exportar `SUPABASE_ACCESS_TOKEN`; definir también `SUPABASE_PROJECT_REF` en la sesión local. Ninguno se guarda en el repositorio.
3. Antes de aplicar migraciones, ejecutar `powershell -ExecutionPolicy Bypass -File scripts/deploy-supabase-functions.ps1 -HealthOnly` y comprobar `GET /functions/v1/health`.
4. Ejecutar `powershell -ExecutionPolicy Bypass -File scripts/deploy-supabase-functions.ps1` para publicar las demás Functions. Estas no deben recibir tráfico hasta que se aplique el esquema al final.
5. Programar un `POST` a `expire-reservations` cada 1–5 minutos con `Authorization: Bearer $CRON_SECRET` desde un programador confiable, después de aplicar el esquema.
6. Alertar si el job falla o no hay ejecución exitosa en diez minutos.

El script despliega únicamente Functions y secrets. No ejecuta `db push`, no crea tablas ni aplica migraciones.

En producción, `REQUIRE_TURNSTILE=true` hace obligatorio `TURNSTILE_SECRET`; sin él, se rechaza el checkout. En desarrollo puede omitirse temporalmente, aunque el rate limit siempre permanece activo.
