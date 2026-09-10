# Prueba de aceptación — Slice 1 (staging)

## Precondiciones

- `front/.env.local` contiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` correctos.
- La aplicación se ejecuta con `npm run dev` desde `front/`.
- Se usa un correo que todavía no existe en Supabase Auth.

## Caso principal

1. Abrir la aplicación y elegir **Crear tienda**.
2. Registrar nombre, correo y una contraseña de al menos 12 caracteres.
3. Confirmar el correo recibido por Supabase, si la confirmación está activada.
4. Iniciar sesión desde **Ya tengo una cuenta**.
5. Crear una tienda con un nombre y subdominio únicos, por ejemplo `prueba-andy-01`.
6. Verificar el dashboard: debe mostrar el nombre, el slug, rol **propietario** y estado **Activa**.
7. Cerrar sesión. Entrar de nuevo con la misma cuenta y verificar que aparece la misma tienda.

## Aislamiento mínimo

1. Crear una segunda cuenta y una segunda tienda con otro slug.
2. Iniciar sesión con cada cuenta por separado.
3. Cada dashboard debe listar únicamente su propia tienda; AnimeGeek y la otra tienda no deben ser visibles.

## Resultado esperado

- La creación inserta tenant, configuración, membership `owner` y evento de auditoría de forma atómica.
- Un correo sin confirmar no puede provisionar una tienda.
- Un usuario autenticado no puede leer tenants a los que no pertenece.
