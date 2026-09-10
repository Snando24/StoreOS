# Plan completo de desarrollo — Tienda online de productos de anime, cómics y superhéroes

**Nombre provisional del proyecto:** Geek Store  
**Versión del documento:** 1.0  
**Estado:** Planificación inicial  
**Stack propuesto:** React + Vite + TypeScript + Tailwind CSS + Supabase + Vercel  
**Mercado inicial:** Perú  
**Canal de venta inicial:** Web responsive con pedidos directos y opción de cierre por WhatsApp  
**Objetivo:** Construir una tienda online administrable para vender funkos, mangas, historietas, figuras, juguetes, ropa y accesorios relacionados con anime, Marvel, DC, videojuegos y cultura geek.

---

## 1. Objetivo general

Desarrollar una plataforma de comercio electrónico moderna, rápida y adaptable a dispositivos móviles que permita:

- Mostrar un catálogo organizado de productos.
- Buscar y filtrar productos.
- Administrar precios, stock, imágenes y promociones.
- Agregar productos a un carrito.
- Registrar pedidos.
- Permitir pagos manuales o en línea.
- Gestionar pedidos desde un panel administrativo.
- Controlar inventario.
- Publicar preventas y ediciones limitadas.
- Preparar el sistema para crecimiento futuro.

La primera versión debe estar orientada a vender lo antes posible, sin incluir funciones innecesarias que retrasen el lanzamiento.

---

## 2. Visión del producto

La tienda debe transmitir una identidad:

- Geek y coleccionista.
- Moderna y profesional.
- Visualmente atractiva.
- Confiable para compras.
- No excesivamente infantil.
- Centrada en productos y franquicias.
- Optimizada para visitantes provenientes de TikTok, Instagram, Facebook y WhatsApp.

El usuario debe poder encontrar un producto, revisar sus características y completar un pedido en pocos pasos.

---

## 3. Público objetivo

### 3.1 Clientes principales

- Coleccionistas de funkos y figuras.
- Fans de anime y manga.
- Seguidores de Marvel, DC y otras franquicias.
- Personas que buscan regalos temáticos.
- Compradores de historietas, cómics y mangas.
- Padres que compran juguetes para sus hijos.
- Jóvenes y adultos interesados en cultura geek.
- Usuarios que buscan ediciones limitadas o preventas.

### 3.2 Perfil inicial

- Edad aproximada: 14 a 45 años.
- Uso predominante desde dispositivos móviles.
- Descubrimiento de productos mediante redes sociales.
- Preferencia por comunicación rápida mediante WhatsApp.
- Interés en conocer disponibilidad, autenticidad y tiempo de entrega.

---

## 4. Alcance del proyecto

## 4.1 Alcance de la primera versión — MVP

La primera versión incluirá:

1. Página de inicio.
2. Catálogo de productos.
3. Categorías y franquicias.
4. Buscador.
5. Filtros.
6. Página de detalle del producto.
7. Galería de imágenes.
8. Carrito de compras.
9. Registro de pedido.
10. Confirmación por WhatsApp.
11. Métodos de pago manuales.
12. Panel administrativo.
13. Gestión de productos.
14. Gestión de categorías.
15. Gestión de stock.
16. Gestión de pedidos.
17. Productos destacados.
18. Ofertas y precios rebajados.
19. Preventas.
20. Diseño responsive.
21. SEO básico.
22. Despliegue en producción.
23. Configuración de dominio.
24. Políticas y páginas legales básicas.

## 4.2 Funciones posteriores al MVP

Quedan fuera de la primera entrega:

- Aplicación móvil nativa.
- Programa de puntos.
- Sistema de afiliados.
- Marketplace de múltiples vendedores.
- Chat interno.
- Recomendaciones con inteligencia artificial.
- Subastas.
- Venta de productos usados entre usuarios.
- Integración con operadores logísticos en tiempo real.
- Facturación electrónica automática.
- Multimoneda.
- Venta internacional.
- Múltiples almacenes.
- Sistema avanzado de devoluciones.
- Suscripciones mensuales.
- Panel financiero completo.

Estas funciones se evaluarán después de validar que la tienda recibe visitas y pedidos.

---

## 5. Modelo de negocio inicial

## 5.1 Formas de venta

- Venta de productos disponibles.
- Preventa de productos próximos a llegar.
- Venta de ediciones limitadas.
- Promociones por temporada.
- Combos.
- Venta cruzada de productos relacionados.
- Reservas con adelanto.
- Productos bajo pedido.

## 5.2 Canales de adquisición

- TikTok.
- Instagram.
- Facebook.
- WhatsApp Business.
- Google.
- Publicaciones en grupos de coleccionistas.
- Campañas con códigos de descuento.
- Influencers o creadores de contenido geek.
- Ferias y eventos locales.

## 5.3 Fuentes de ingreso

- Margen por producto.
- Envío.
- Preventas.
- Combos.
- Productos exclusivos.
- Productos personalizados en una fase futura.

---

## 6. Requerimientos funcionales

## 6.1 Página de inicio

Debe incluir:

- Encabezado con logo.
- Buscador.
- Acceso al carrito.
- Navegación por categorías.
- Banner principal.
- Productos destacados.
- Novedades.
- Ofertas.
- Preventas.
- Categorías principales.
- Franquicias populares.
- Productos más vendidos.
- Beneficios de compra.
- Métodos de pago.
- Información de envío.
- Enlace a WhatsApp.
- Redes sociales.
- Pie de página.

### Criterios de aceptación

- La página debe cargar correctamente en móvil y escritorio.
- Los banners deben poder administrarse.
- Los productos mostrados deben provenir de la base de datos.
- Los botones deben dirigir a categorías, productos o promociones válidas.
- El carrito debe ser visible desde el encabezado.

---

## 6.2 Catálogo

El catálogo debe permitir:

- Listar productos activos.
- Cambiar entre categorías.
- Ordenar por precio.
- Ordenar por novedades.
- Ordenar por popularidad.
- Filtrar por rango de precio.
- Filtrar por stock.
- Filtrar por marca.
- Filtrar por franquicia.
- Filtrar por personaje.
- Filtrar por condición.
- Filtrar por preventa.
- Buscar por texto.
- Paginar resultados o usar carga progresiva.

### Criterios de aceptación

- Los filtros deben combinarse.
- Los productos sin stock pueden ocultarse o mostrarse como agotados.
- La URL debe conservar los filtros principales.
- El catálogo debe funcionar correctamente con cero resultados.
- Debe existir una opción para limpiar filtros.

---

## 6.3 Detalle de producto

Cada producto debe mostrar:

- Nombre.
- Slug único.
- Precio normal.
- Precio de oferta.
- Estado del stock.
- Cantidad disponible.
- Descripción.
- Especificaciones.
- Franquicia.
- Personaje.
- Marca.
- Tipo de producto.
- Estado: nuevo, usado, caja dañada u otro.
- Imágenes.
- Video opcional.
- Código SKU.
- Información sobre autenticidad.
- Estado de preventa.
- Fecha estimada de llegada.
- Botón de agregar al carrito.
- Botón de comprar por WhatsApp.
- Productos relacionados.
- Política de entrega.
- Política de cambios.

### Criterios de aceptación

- No se debe permitir agregar más unidades de las disponibles.
- La imagen principal debe poder ampliarse.
- El precio de oferta debe diferenciarse claramente.
- Los productos inactivos no deben ser accesibles públicamente.
- Los productos agotados deben indicar su estado.

---

## 6.4 Carrito

El carrito debe permitir:

- Agregar productos.
- Modificar cantidades.
- Eliminar productos.
- Mostrar subtotal.
- Mostrar descuentos.
- Mostrar costo de envío estimado.
- Mostrar total.
- Conservar productos al recargar la página.
- Validar stock antes de crear el pedido.
- Vaciar carrito después de confirmar el pedido.

### Persistencia inicial

Usar `localStorage` para conservar el carrito sin exigir registro.

### Criterios de aceptación

- No se puede comprar una cantidad mayor al stock.
- La suma debe actualizarse automáticamente.
- El carrito debe conservarse después de cerrar y abrir el navegador.
- Los precios deben verificarse nuevamente desde el servidor antes de guardar el pedido.

---

## 6.5 Proceso de compra

### Datos del cliente

- Nombres y apellidos.
- Celular.
- Correo opcional.
- Documento opcional.
- Departamento.
- Provincia.
- Distrito.
- Dirección.
- Referencia.
- Tipo de entrega.
- Método de pago.
- Comentarios del pedido.

### Métodos de entrega

- Recojo en tienda o punto acordado.
- Envío local.
- Envío nacional.
- Entrega coordinada por WhatsApp.

### Métodos de pago iniciales

- Yape.
- Plin.
- Transferencia bancaria.
- Pago contra entrega, cuando corresponda.
- Pasarela de pago en una fase posterior o dentro del MVP si el presupuesto lo permite.

### Flujo

1. Cliente revisa el carrito.
2. Completa sus datos.
3. Selecciona entrega.
4. Selecciona método de pago.
5. El sistema valida precios y stock.
6. Se crea el pedido.
7. Se asigna un código.
8. Se muestra una confirmación.
9. Se genera un mensaje para WhatsApp.
10. El administrador recibe el pedido.
11. El stock se reserva o descuenta según la regla definida.

### Criterios de aceptación

- No se debe crear un pedido sin productos.
- Los datos obligatorios deben validarse.
- El código de pedido debe ser único.
- El total debe calcularse en el backend.
- El pedido debe aparecer en el panel administrativo.
- Debe mostrarse una pantalla de confirmación.

---

## 6.6 WhatsApp

El sistema debe generar un mensaje como:

```text
Hola, quiero confirmar el pedido #GS-000123.

Productos:
- Funko Spider-Man x1 — S/ 79.90
- Manga One Piece Vol. 1 x2 — S/ 49.80

Subtotal: S/ 129.70
Envío: por coordinar
Total: S/ 129.70

Nombre: Cliente
Distrito: Distrito seleccionado
Método de pago: Yape
```

### Reglas

- El número de WhatsApp se configura mediante variable de entorno.
- El mensaje debe usar los datos reales del pedido.
- No se deben enviar datos sensibles innecesarios.
- El pedido debe registrarse antes de abrir WhatsApp.

---

## 6.7 Panel administrativo

El panel debe estar protegido mediante autenticación.

### Módulos

#### Dashboard

- Ventas del día.
- Pedidos pendientes.
- Pedidos pagados.
- Pedidos enviados.
- Productos con stock bajo.
- Productos agotados.
- Últimos pedidos.
- Productos más vendidos.
- Total de productos activos.

#### Productos

- Crear.
- Editar.
- Desactivar.
- Duplicar.
- Eliminar de forma lógica.
- Administrar imágenes.
- Administrar stock.
- Administrar oferta.
- Administrar preventa.
- Marcar como destacado.
- Configurar SEO.

#### Categorías

- Crear.
- Editar.
- Activar o desactivar.
- Imagen.
- Orden de presentación.
- Slug.

#### Franquicias

- Crear.
- Editar.
- Imagen o logo.
- Estado.
- Orden.

#### Pedidos

- Visualizar pedido.
- Cambiar estado.
- Registrar pago.
- Registrar código de envío.
- Añadir notas internas.
- Contactar al cliente.
- Cancelar pedido.
- Restaurar stock al cancelar.

#### Banners

- Crear campañas.
- Subir imagen.
- Configurar enlace.
- Definir fechas de publicación.
- Activar o desactivar.

#### Configuración

- Nombre de la tienda.
- Logo.
- WhatsApp.
- Redes sociales.
- Dirección.
- Métodos de pago.
- Métodos de envío.
- Políticas.
- Mensajes de confirmación.

---

## 7. Roles y permisos

## 7.1 Administrador

Puede:

- Gestionar toda la tienda.
- Crear usuarios administrativos.
- Modificar configuraciones.
- Ver reportes.
- Gestionar productos y pedidos.

## 7.2 Operador

Puede:

- Ver pedidos.
- Cambiar estados.
- Gestionar stock.
- Editar productos.
- No puede modificar usuarios ni configuraciones sensibles.

## 7.3 Cliente

En el MVP no necesita una cuenta.

En una fase posterior podrá:

- Registrarse.
- Ver sus pedidos.
- Guardar favoritos.
- Administrar direcciones.
- Recibir cupones.
- Solicitar devoluciones.

---

## 8. Arquitectura técnica

## 8.1 Frontend

- React.
- Vite.
- TypeScript.
- React Router.
- Tailwind CSS.
- TanStack Query para consultas y caché.
- React Hook Form.
- Zod para validaciones.
- Context API o Zustand para carrito y estado global.
- Componentes reutilizables.

## 8.2 Backend

Para el MVP:

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Row Level Security.
- Funciones SQL.
- Edge Functions para operaciones sensibles, cuando corresponda.

## 8.3 Hosting

- Frontend en Vercel.
- Base de datos y almacenamiento en Supabase.
- Dominio personalizado.
- Certificado HTTPS automático.

## 8.4 Diagrama simplificado

```text
Cliente
   |
   v
Aplicación React en Vercel
   |
   +----> Supabase Auth
   |
   +----> Supabase PostgreSQL
   |
   +----> Supabase Storage
   |
   +----> Edge Functions
   |
   +----> WhatsApp
   |
   +----> Pasarela de pago futura
```

---

## 9. Estructura del proyecto

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
├── assets/
├── components/
│   ├── common/
│   ├── layout/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   └── admin/
├── features/
│   ├── auth/
│   ├── products/
│   ├── categories/
│   ├── franchises/
│   ├── cart/
│   ├── orders/
│   ├── banners/
│   └── settings/
├── hooks/
├── lib/
│   ├── supabase/
│   ├── validation/
│   ├── formatting/
│   └── errors/
├── pages/
│   ├── public/
│   ├── checkout/
│   └── admin/
├── services/
├── store/
├── types/
├── utils/
└── main.tsx
```

---

## 10. Modelo de datos

## 10.1 Entidades principales

- Usuarios administrativos.
- Roles.
- Categorías.
- Franquicias.
- Marcas.
- Productos.
- Imágenes.
- Variantes.
- Movimientos de stock.
- Banners.
- Clientes.
- Direcciones.
- Pedidos.
- Detalles de pedido.
- Pagos.
- Métodos de envío.
- Cupones.
- Configuración.

---

## 10.2 Tabla `categories`

```sql
create table public.categories (
  id bigint generated by default as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.3 Tabla `franchises`

```sql
create table public.franchises (
  id bigint generated by default as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.4 Tabla `brands`

```sql
create table public.brands (
  id bigint generated by default as identity primary key,
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.5 Tabla `products`

```sql
create table public.products (
  id bigint generated by default as identity primary key,
  name text not null,
  slug text not null unique,
  sku text unique,
  short_description text,
  description text,
  category_id bigint references public.categories(id),
  franchise_id bigint references public.franchises(id),
  brand_id bigint references public.brands(id),
  character_name text,
  condition text not null default 'new',
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 3,
  featured boolean not null default false,
  preorder boolean not null default false,
  preorder_arrival_date date,
  authentic boolean,
  active boolean not null default true,
  weight_grams integer,
  length_cm numeric(8,2),
  width_cm numeric(8,2),
  height_cm numeric(8,2),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.6 Tabla `product_images`

```sql
create table public.product_images (
  id bigint generated by default as identity primary key,
  product_id bigint not null
    references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
```

---

## 10.7 Tabla `customers`

```sql
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  document_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.8 Tabla `orders`

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_type text not null,
  department text,
  province text,
  district text,
  address text,
  address_reference text,
  payment_method text not null,
  payment_status text not null default 'pending',
  order_status text not null default 'pending',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  total numeric(12,2) not null check (total >= 0),
  customer_notes text,
  internal_notes text,
  tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.9 Tabla `order_items`

```sql
create table public.order_items (
  id bigint generated by default as identity primary key,
  order_id uuid not null
    references public.orders(id) on delete cascade,
  product_id bigint references public.products(id),
  sku text,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
```

---

## 10.10 Tabla `stock_movements`

```sql
create table public.stock_movements (
  id bigint generated by default as identity primary key,
  product_id bigint not null references public.products(id),
  movement_type text not null,
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reference_type text,
  reference_id text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);
```

Tipos sugeridos:

- `purchase`
- `sale`
- `reservation`
- `release`
- `adjustment`
- `return`
- `cancellation`

---

## 10.11 Tabla `banners`

```sql
create table public.banners (
  id bigint generated by default as identity primary key,
  title text,
  subtitle text,
  image_url text not null,
  mobile_image_url text,
  link_url text,
  button_text text,
  start_at timestamptz,
  end_at timestamptz,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 10.12 Tabla `store_settings`

```sql
create table public.store_settings (
  id bigint generated by default as identity primary key,
  setting_key text not null unique,
  setting_value jsonb not null,
  updated_at timestamptz not null default now()
);
```

---

## 11. Estados del pedido

Estados recomendados:

```text
pending
confirmed
awaiting_payment
paid
preparing
shipped
ready_for_pickup
delivered
cancelled
refunded
```

### Flujo típico

```text
pending
   ↓
confirmed
   ↓
awaiting_payment
   ↓
paid
   ↓
preparing
   ↓
shipped
   ↓
delivered
```

### Reglas

- Un pedido cancelado debe restaurar stock cuando corresponda.
- Un pedido pagado no debe eliminarse.
- Los cambios de estado deben guardar fecha y usuario.
- Los estados deben mostrarse en español en la interfaz.

---

## 12. Reglas de inventario

1. El stock nunca puede quedar negativo.
2. El precio del pedido debe tomarse desde el servidor.
3. El cliente no debe poder modificar precios desde el navegador.
4. El sistema debe volver a validar el stock al confirmar.
5. Una cancelación debe restaurar unidades.
6. Los ajustes manuales deben generar un movimiento.
7. Los productos con stock bajo deben aparecer en el dashboard.
8. Las preventas pueden utilizar un cupo independiente o stock reservado.
9. No se debe eliminar físicamente un producto con pedidos asociados.
10. Los productos inactivos deben conservarse para el historial.

---

## 13. Seguridad

## 13.1 Autenticación

- Supabase Auth para administradores.
- Inicio de sesión con correo y contraseña.
- Recuperación de contraseña.
- Sesiones seguras.
- Cierre de sesión.
- Restricción del panel por rol.

## 13.2 Row Level Security

Activar RLS en todas las tablas.

### Acceso público

El público solo podrá leer:

- Productos activos.
- Categorías activas.
- Franquicias activas.
- Banners activos.
- Configuración pública.

### Acceso administrativo

Solo usuarios autorizados podrán:

- Crear y editar productos.
- Ver todos los pedidos.
- Cambiar stock.
- Gestionar configuraciones.
- Consultar datos privados de clientes.

## 13.3 Reglas adicionales

- Nunca exponer la `service_role_key` en el frontend.
- Guardar secretos en variables de entorno.
- Validar entradas con Zod.
- Limitar tamaño y tipo de archivos.
- Sanitizar nombres de archivo.
- Usar HTTPS.
- Aplicar rate limiting a funciones críticas.
- Registrar errores sin mostrar información sensible.
- Crear respaldos.
- Revisar políticas de Storage.
- Evitar consultas directas que permitan modificar totales.
- Usar funciones de backend para crear pedidos.

---

## 14. Creación segura de pedidos

La creación de pedidos debe realizarse mediante una función controlada.

### Responsabilidades de la función

1. Recibir los identificadores y cantidades.
2. Consultar productos desde la base de datos.
3. Verificar que estén activos.
4. Verificar stock.
5. Obtener precios reales.
6. Calcular subtotal.
7. Aplicar descuentos autorizados.
8. Calcular envío.
9. Generar total.
10. Crear cliente o reutilizarlo.
11. Crear pedido.
12. Crear detalles.
13. Descontar o reservar stock.
14. Registrar movimientos.
15. Retornar código de pedido.

No se debe confiar en:

- Precio enviado por el navegador.
- Total enviado por el navegador.
- Nombre de producto enviado por el navegador.
- Descuento enviado por el navegador.

---

## 15. Gestión de imágenes

## 15.1 Almacenamiento

Usar Supabase Storage.

Buckets sugeridos:

```text
products
categories
franchises
banners
store
```

## 15.2 Reglas

- Formatos: WebP, JPG o PNG.
- Convertir imágenes pesadas a WebP.
- Establecer tamaño máximo.
- Usar nombres únicos.
- Incluir texto alternativo.
- Mostrar miniaturas.
- Permitir ordenar imágenes.
- Permitir elegir imagen principal.
- Eliminar imágenes huérfanas.
- Generar versión móvil para banners.

## 15.3 Tamaños sugeridos

- Producto: 1000 × 1000 px.
- Miniatura: 400 × 400 px.
- Banner escritorio: 1920 × 700 px.
- Banner móvil: 1080 × 1350 px.
- Categoría: 800 × 800 px.

---

## 16. Diseño visual

## 16.1 Dirección de diseño

- Fondo oscuro o neutro.
- Tarjetas limpias.
- Contraste alto.
- Tipografía moderna.
- Colores eléctricos usados con moderación.
- Imágenes grandes.
- Navegación sencilla.
- Animaciones ligeras.
- Sin sobrecargar la interfaz.

## 16.2 Paleta preliminar

```text
Fondo principal:       #0B0B10
Fondo secundario:      #15151D
Superficie:            #1D1D28
Texto principal:       #FFFFFF
Texto secundario:      #B7B7C8
Morado principal:      #7C3AED
Rojo de promoción:     #EF4444
Azul de acción:        #2563EB
Verde de disponibilidad:#22C55E
```

La paleta final debe adaptarse al logo.

## 16.3 Componentes visuales

- Header.
- Menú móvil.
- Buscador.
- Hero banner.
- Tarjeta de producto.
- Badge.
- Selector de cantidad.
- Filtros.
- Breadcrumb.
- Galería.
- Carrito lateral.
- Modal.
- Toast.
- Formulario.
- Tabla administrativa.
- Paginación.
- Skeleton loader.
- Empty state.
- Error state.

---

## 17. Responsive design

Resoluciones mínimas:

- Móvil: 360 px.
- Tablet: 768 px.
- Laptop: 1024 px.
- Escritorio: 1440 px.

### Reglas

- Prioridad móvil.
- Menú colapsable.
- Carrito accesible.
- Botones táctiles grandes.
- Filtros en panel lateral.
- Formularios de una sola columna en móvil.
- Imágenes optimizadas.
- Evitar desplazamiento horizontal.
- Mantener el botón de compra visible en producto.

---

## 18. SEO

## 18.1 SEO técnico

- Títulos únicos.
- Descripciones únicas.
- URLs legibles.
- Etiquetas canonical.
- Sitemap.
- Robots.txt.
- Open Graph.
- Datos estructurados de producto.
- Datos estructurados de organización.
- Texto alternativo en imágenes.
- Página 404.
- Redirecciones.
- Buen rendimiento.
- HTTPS.

## 18.2 Estructura de URLs

```text
/
 /productos
 /producto/funko-spider-man-123
 /categoria/funkos
 /franquicia/marvel
 /ofertas
 /preventas
 /contacto
 /politica-de-privacidad
 /terminos-y-condiciones
```

## 18.3 Contenido

Crear textos para:

- Categorías.
- Franquicias.
- Productos.
- Preguntas frecuentes.
- Métodos de pago.
- Envíos.
- Autenticidad.
- Preventas.

---

## 19. Analítica

Integrar:

- Google Analytics o alternativa.
- Google Search Console.
- Meta Pixel si se harán campañas.
- Eventos internos de conversión.

### Eventos recomendados

```text
view_home
view_category
view_product
search
add_to_cart
remove_from_cart
begin_checkout
submit_order
open_whatsapp
purchase_confirmed
```

### Indicadores

- Visitas.
- Productos vistos.
- Conversión.
- Abandono de carrito.
- Pedidos por canal.
- Ticket promedio.
- Productos más vistos.
- Productos más vendidos.
- Búsquedas sin resultados.
- Dispositivos utilizados.

---

## 20. Rendimiento

Metas:

- Carga inicial rápida.
- Imágenes optimizadas.
- Lazy loading.
- División de código.
- Caché de consultas.
- Evitar librerías innecesarias.
- Índices en base de datos.
- Consultas paginadas.
- Skeletons durante carga.
- Minimizar JavaScript.

### Objetivos técnicos sugeridos

- Lighthouse Performance: 85 o superior.
- Accessibility: 90 o superior.
- Best Practices: 90 o superior.
- SEO: 90 o superior.

---

## 21. Accesibilidad

- Navegación mediante teclado.
- Labels visibles.
- Contraste adecuado.
- Texto alternativo.
- Mensajes de error claros.
- Botones con nombres accesibles.
- Estados de foco.
- No depender únicamente del color.
- Soporte para lectores de pantalla.
- Tamaños táctiles adecuados.

---

## 22. Páginas legales y confianza

Crear:

- Términos y condiciones.
- Política de privacidad.
- Política de cambios y devoluciones.
- Política de envíos.
- Métodos de pago.
- Preguntas frecuentes.
- Contacto.
- Información sobre autenticidad.
- Condiciones de preventa.

### Advertencia de marca

La tienda no debe presentarse como representante oficial de Marvel, DC, Disney, Pokémon, Funko u otra franquicia sin contar con autorización.

Las imágenes, nombres y marcas deben utilizarse únicamente para identificar productos legítimos comercializados.

---

## 23. Pruebas

## 23.1 Pruebas unitarias

Probar:

- Cálculo de totales.
- Formateo de moneda.
- Validación de formularios.
- Manejo de descuentos.
- Reglas de stock.
- Generación de mensajes de WhatsApp.
- Transformación de datos.

## 23.2 Pruebas de integración

Probar:

- Crear pedido.
- Descontar stock.
- Cancelar pedido.
- Restaurar stock.
- Crear producto.
- Subir imágenes.
- Autenticación.
- Filtros combinados.

## 23.3 Pruebas end-to-end

Flujos mínimos:

1. Cliente visita inicio.
2. Busca un producto.
3. Abre detalle.
4. Agrega al carrito.
5. Completa checkout.
6. Crea pedido.
7. Abre WhatsApp.
8. Administrador inicia sesión.
9. Revisa pedido.
10. Cambia estado.

## 23.4 Pruebas manuales

- Chrome.
- Firefox.
- Edge.
- Safari móvil cuando sea posible.
- Android.
- iPhone.
- Conexión lenta.
- Pantallas pequeñas.
- Producto sin stock.
- Pedido con múltiples productos.
- Error de red.
- Sesión expirada.

---

## 24. Manejo de errores

El sistema debe contemplar:

- Error al cargar productos.
- Error al subir imágenes.
- Pedido sin stock.
- Producto desactivado.
- Error de autenticación.
- Sesión vencida.
- Error de conexión.
- Carrito desactualizado.
- Imagen inexistente.
- Error al crear pedido.

### Principios

- Mostrar mensajes entendibles.
- Registrar detalle técnico.
- No exponer secretos.
- Permitir reintentar.
- No perder el carrito.
- Evitar pedidos duplicados.
- Usar identificadores de error.

---

## 25. Variables de entorno

Ejemplo:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STORE_NAME=
VITE_STORE_WHATSAPP=
VITE_STORE_CURRENCY=PEN
VITE_STORE_LOCALE=es-PE
VITE_SITE_URL=
```

Variables privadas para funciones:

```env
SUPABASE_SERVICE_ROLE_KEY=
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=
EMAIL_PROVIDER_KEY=
```

Nunca subir archivos `.env` al repositorio.

---

## 26. Git y flujo de trabajo

## 26.1 Ramas

```text
main
develop
feature/*
fix/*
hotfix/*
```

## 26.2 Convención de commits

```text
feat: agregar catálogo de productos
fix: corregir validación de stock
docs: actualizar plan de desarrollo
refactor: reorganizar servicios de pedidos
test: agregar pruebas del carrito
chore: actualizar dependencias
```

## 26.3 Pull requests

Cada cambio debe incluir:

- Descripción.
- Capturas cuando haya cambios visuales.
- Pasos para probar.
- Riesgos.
- Checklist.
- Revisión antes de fusionar.

---

## 27. Ambientes

## 27.1 Desarrollo

- Base de datos de prueba.
- Datos ficticios.
- Logs detallados.
- Dominio local.

## 27.2 Preview

- Despliegue automático por pull request.
- Base de datos de staging.
- Pruebas de aceptación.

## 27.3 Producción

- Dominio definitivo.
- Base de datos real.
- Variables seguras.
- Monitoreo.
- Backups.
- Analytics.

No se deben mezclar datos de prueba con producción.

---

## 28. Fases de desarrollo

## Fase 0 — Definición del negocio

### Tareas

- Definir nombre.
- Definir logo.
- Definir colores.
- Definir catálogo inicial.
- Definir categorías.
- Definir franquicias.
- Definir métodos de pago.
- Definir métodos de entrega.
- Definir número de WhatsApp.
- Definir políticas.
- Registrar dominio.
- Reunir imágenes y descripciones.

### Entregable

Documento de identidad y reglas comerciales.

### Criterio de finalización

Toda la información necesaria para construir la tienda está definida.

---

## Fase 1 — Preparación técnica

### Tareas

- Crear repositorio.
- Crear proyecto React + Vite + TypeScript.
- Instalar Tailwind.
- Configurar ESLint y Prettier.
- Configurar rutas.
- Crear proyecto Supabase.
- Crear proyecto Vercel.
- Configurar variables.
- Crear estructura de carpetas.
- Definir componentes base.
- Crear sistema de diseño inicial.

### Entregable

Proyecto base compilando y desplegado.

### Criterio de finalización

La aplicación carga en Vercel y se conecta correctamente a Supabase.

---

## Fase 2 — Base de datos y seguridad

### Tareas

- Crear tablas.
- Crear relaciones.
- Crear índices.
- Crear triggers de actualización.
- Crear funciones.
- Activar RLS.
- Crear políticas.
- Crear buckets.
- Configurar permisos de Storage.
- Crear usuario administrador.
- Cargar datos de prueba.

### Entregable

Base de datos funcional y protegida.

### Criterio de finalización

El público solo accede a datos públicos y el administrador puede gestionar información autorizada.

---

## Fase 3 — Diseño público

### Tareas

- Header.
- Menú.
- Footer.
- Home.
- Banners.
- Categorías.
- Secciones destacadas.
- Tarjetas de producto.
- Estados de carga.
- Estados vacíos.
- Diseño móvil.
- Diseño escritorio.

### Entregable

Interfaz pública navegable.

### Criterio de finalización

La página principal funciona y consume datos reales.

---

## Fase 4 — Catálogo y productos

### Tareas

- Listado.
- Paginación.
- Buscador.
- Filtros.
- Ordenamiento.
- URL de filtros.
- Detalle.
- Galería.
- Productos relacionados.
- Stock.
- Ofertas.
- Preventas.

### Entregable

Catálogo completo.

### Criterio de finalización

El cliente encuentra y revisa productos correctamente.

---

## Fase 5 — Carrito

### Tareas

- Store global.
- Persistencia.
- Agregar producto.
- Modificar cantidad.
- Eliminar producto.
- Calcular subtotal.
- Validar stock.
- Vista de carrito.
- Carrito lateral.
- Estados vacíos.

### Entregable

Carrito funcional.

### Criterio de finalización

El carrito se conserva y no permite cantidades inválidas.

---

## Fase 6 — Checkout y pedidos

### Tareas

- Formulario del cliente.
- Validaciones.
- Dirección.
- Método de entrega.
- Método de pago.
- Cálculo de envío.
- Función segura de pedido.
- Código de pedido.
- Confirmación.
- Mensaje de WhatsApp.
- Registro de stock.
- Prevención de duplicados.

### Entregable

Proceso completo de pedido.

### Criterio de finalización

Un cliente puede crear un pedido real y el administrador puede verlo.

---

## Fase 7 — Panel administrativo

### Tareas

- Login.
- Rutas protegidas.
- Dashboard.
- CRUD de productos.
- Gestión de imágenes.
- Categorías.
- Franquicias.
- Pedidos.
- Estados.
- Stock.
- Banners.
- Configuración.
- Logout.

### Entregable

Panel administrativo operativo.

### Criterio de finalización

La tienda puede administrarse sin editar directamente la base de datos.

---

## Fase 8 — SEO, analítica y legales

### Tareas

- Metadatos.
- Sitemap.
- Robots.
- Open Graph.
- Schema de producto.
- Analytics.
- Search Console.
- Páginas legales.
- FAQ.
- Página de contacto.
- Página 404.

### Entregable

Tienda preparada para indexación y medición.

---

## Fase 9 — Pruebas y optimización

### Tareas

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Revisión responsive.
- Revisión de seguridad.
- Optimización de imágenes.
- Revisión de rendimiento.
- Corrección de errores.
- Prueba de pedido real.
- Prueba desde diferentes dispositivos.

### Entregable

Versión candidata a producción.

---

## Fase 10 — Lanzamiento

### Tareas

- Configurar dominio.
- Configurar producción.
- Cargar catálogo real.
- Revisar precios.
- Revisar stock.
- Revisar WhatsApp.
- Revisar pagos.
- Publicar políticas.
- Activar analytics.
- Crear backup.
- Publicar.
- Monitorear errores.
- Realizar compra de prueba.

### Entregable

Tienda publicada.

---

## 29. Cronograma sugerido

## Semana 1

- Definición de negocio.
- Branding.
- Arquitectura.
- Repositorio.
- Configuración del proyecto.
- Base de datos inicial.

## Semana 2

- Diseño base.
- Header.
- Footer.
- Home.
- Componentes reutilizables.

## Semana 3

- Catálogo.
- Búsqueda.
- Filtros.
- Ordenamiento.

## Semana 4

- Detalle de producto.
- Galería.
- Productos relacionados.
- Stock y ofertas.

## Semana 5

- Carrito.
- Persistencia.
- Validaciones.
- UX móvil.

## Semana 6

- Checkout.
- Creación segura de pedidos.
- WhatsApp.
- Confirmación.

## Semana 7

- Login administrativo.
- Dashboard.
- Gestión de productos.

## Semana 8

- Pedidos.
- Stock.
- Banners.
- Configuración.

## Semana 9

- SEO.
- Analítica.
- Legales.
- Accesibilidad.

## Semana 10

- Pruebas.
- Optimización.
- Corrección.
- Lanzamiento.

El cronograma puede reducirse si una sola persona trabaja a tiempo completo y ya dispone de contenido, productos e identidad visual.

---

## 30. Backlog por prioridad

## Prioridad crítica

- Configuración del proyecto.
- Base de datos.
- Productos.
- Stock.
- Catálogo.
- Detalle.
- Carrito.
- Checkout.
- Registro de pedidos.
- Panel administrativo.
- Seguridad.
- Responsive.
- Producción.

## Prioridad alta

- Búsqueda.
- Filtros.
- Ofertas.
- Preventas.
- WhatsApp.
- Banners.
- SEO.
- Analytics.
- Políticas.

## Prioridad media

- Cupones.
- Productos relacionados.
- Reportes.
- Historial de estados.
- Notificaciones.
- Exportación de pedidos.

## Prioridad futura

- Cuenta de cliente.
- Favoritos.
- Puntos.
- Reseñas.
- Pasarela avanzada.
- Aplicación móvil.
- Facturación.
- Recomendaciones.
- Multialmacén.

---

## 31. Historias de usuario

### HU-001 — Ver catálogo

Como visitante, quiero ver productos disponibles para conocer lo que vende la tienda.

### HU-002 — Buscar producto

Como visitante, quiero buscar por nombre, personaje o franquicia para encontrar productos rápidamente.

### HU-003 — Filtrar productos

Como visitante, quiero filtrar por categoría, precio y franquicia para reducir resultados.

### HU-004 — Revisar producto

Como visitante, quiero ver imágenes, precio, descripción y stock para decidir mi compra.

### HU-005 — Agregar al carrito

Como cliente, quiero agregar productos al carrito para comprarlos juntos.

### HU-006 — Crear pedido

Como cliente, quiero completar mis datos y confirmar el pedido para recibir los productos.

### HU-007 — Contactar por WhatsApp

Como cliente, quiero enviar el resumen por WhatsApp para coordinar pago y entrega.

### HU-008 — Gestionar producto

Como administrador, quiero crear y editar productos para mantener el catálogo actualizado.

### HU-009 — Gestionar pedido

Como administrador, quiero revisar y cambiar estados para controlar las ventas.

### HU-010 — Controlar stock

Como administrador, quiero conocer las unidades disponibles para evitar ventas sin inventario.

---

## 32. Definición de terminado

Una tarea se considera terminada cuando:

- El código está implementado.
- La interfaz es responsive.
- Los datos se validan.
- Los errores se manejan.
- Las pruebas necesarias pasan.
- No se exponen secretos.
- El código fue revisado.
- La función está desplegada en preview.
- Cumple los criterios de aceptación.
- La documentación fue actualizada.

---

## 33. Lista de validación antes del lanzamiento

### Negocio

- [ ] Nombre definitivo.
- [ ] Logo.
- [ ] Colores.
- [ ] Dominio.
- [ ] Número de WhatsApp.
- [ ] Métodos de pago.
- [ ] Métodos de entrega.
- [ ] Políticas.
- [ ] Catálogo inicial.
- [ ] Precios.
- [ ] Stock.

### Técnica

- [ ] Producción conectada a Supabase.
- [ ] Variables configuradas.
- [ ] RLS activa.
- [ ] Buckets protegidos.
- [ ] Backups.
- [ ] Dominio con HTTPS.
- [ ] Analytics.
- [ ] Sitemap.
- [ ] Robots.
- [ ] Página 404.
- [ ] Logs.
- [ ] Pruebas de pedido.

### Interfaz

- [ ] Móvil.
- [ ] Tablet.
- [ ] Escritorio.
- [ ] Menú.
- [ ] Buscador.
- [ ] Filtros.
- [ ] Carrito.
- [ ] Checkout.
- [ ] Confirmación.
- [ ] Panel administrativo.

### Contenido

- [ ] Fotografías optimizadas.
- [ ] Descripciones.
- [ ] Categorías.
- [ ] Franquicias.
- [ ] Información de envío.
- [ ] Preguntas frecuentes.
- [ ] Términos.
- [ ] Privacidad.
- [ ] Cambios y devoluciones.

---

## 34. Riesgos del proyecto

## Riesgo 1 — Falta de contenido

**Problema:** no contar con imágenes, descripciones o precios.

**Mitigación:** preparar un archivo maestro de productos antes de cargar el catálogo.

## Riesgo 2 — Stock incorrecto

**Problema:** vender unidades no disponibles.

**Mitigación:** validación en servidor, movimientos de stock y revisión diaria.

## Riesgo 3 — Pedidos falsos

**Problema:** clientes que registran pedidos y no pagan.

**Mitigación:** estados, tiempo de reserva, confirmación por WhatsApp y cancelación automática futura.

## Riesgo 4 — Uso indebido de credenciales

**Problema:** exposición de llaves privadas.

**Mitigación:** variables de entorno, RLS y funciones de backend.

## Riesgo 5 — Imágenes pesadas

**Problema:** carga lenta.

**Mitigación:** WebP, tamaños definidos y lazy loading.

## Riesgo 6 — Proyecto demasiado grande

**Problema:** retraso por intentar construir demasiadas funciones.

**Mitigación:** respetar el alcance del MVP.

## Riesgo 7 — Propiedad intelectual

**Problema:** usar logos o contenido como si la tienda fuera oficial.

**Mitigación:** vender productos legítimos, usar avisos adecuados y no afirmar afiliaciones no autorizadas.

---

## 35. Mejoras posteriores

### Versión 1.1

- Cupones.
- Correos automáticos.
- Reportes.
- Historial de estados.
- Exportación CSV.
- Mejoras SEO.

### Versión 1.2

- Cuentas de clientes.
- Historial de compras.
- Favoritos.
- Direcciones.
- Reseñas verificadas.

### Versión 1.3

- Pasarela de pago completa.
- Webhooks.
- Reembolsos.
- Confirmación automática.
- Recuperación de carrito.

### Versión 2.0

- Aplicación móvil.
- Programa de fidelización.
- Recomendaciones.
- Multialmacén.
- Integración logística.
- Facturación.
- Panel financiero.

---

## 36. Entregables finales

1. Código fuente.
2. Repositorio Git.
3. Aplicación desplegada.
4. Base de datos.
5. Panel administrativo.
6. Catálogo.
7. Carrito.
8. Checkout.
9. Gestión de pedidos.
10. Control de stock.
11. Documentación técnica.
12. Manual administrativo.
13. Variables documentadas.
14. Scripts SQL.
15. Políticas de seguridad.
16. Checklist de lanzamiento.
17. Plan de backups.
18. Registro de pruebas.
19. Credenciales entregadas de forma segura.
20. Dominio conectado.

---

## 37. Primeras tareas concretas

Ejecutar en este orden:

1. Definir el nombre de la tienda.
2. Definir logo y colores.
3. Crear una lista inicial de 20 a 50 productos.
4. Clasificar productos por categoría y franquicia.
5. Preparar precios, stock, imágenes y descripciones.
6. Crear repositorio.
7. Crear React + Vite + TypeScript.
8. Crear Supabase.
9. Ejecutar migraciones.
10. Configurar RLS.
11. Configurar Vercel.
12. Diseñar la página principal.
13. Construir catálogo.
14. Construir detalle.
15. Construir carrito.
16. Construir checkout.
17. Construir panel.
18. Probar.
19. Cargar productos reales.
20. Publicar.

---

## 38. Decisión recomendada para el MVP

La primera versión debe utilizar:

```text
Frontend:             React + Vite + TypeScript
Estilos:              Tailwind CSS
Base de datos:        Supabase PostgreSQL
Autenticación:        Supabase Auth
Imágenes:             Supabase Storage
Backend sensible:     Supabase Edge Functions / funciones SQL
Hosting:              Vercel
Carrito:              Zustand + localStorage
Pedidos:              Base de datos + WhatsApp
Pago inicial:         Yape, Plin y transferencia
Analítica:            Google Analytics o alternativa
Idioma:               Español
Moneda:               Sol peruano
```

Esta combinación permite lanzar rápidamente, mantener costos iniciales bajos y escalar el sistema sin rehacer la aplicación completa.

---

## 39. Resultado esperado

Al finalizar el MVP, la tienda deberá permitir que:

1. El administrador publique productos.
2. El cliente encuentre productos.
3. El cliente agregue productos al carrito.
4. El sistema valide precios y stock.
5. El cliente registre un pedido.
6. El pedido quede guardado.
7. El cliente continúe la coordinación por WhatsApp.
8. El administrador gestione el pedido.
9. El stock se mantenga actualizado.
10. La tienda funcione correctamente desde móvil y escritorio.

---

## 40. Conclusión

El proyecto debe comenzar como una tienda simple, administrable y confiable. El objetivo inicial no es construir una plataforma enorme, sino publicar una versión capaz de mostrar productos, recibir pedidos y controlar el inventario.

Las funciones avanzadas deben añadirse únicamente después de validar:

- Que existen visitas.
- Que los clientes agregan productos al carrito.
- Que se reciben pedidos.
- Que el proceso de pago funciona.
- Que la administración de stock es suficiente.
- Que el negocio puede mantener el catálogo actualizado.

El éxito de la primera versión se medirá principalmente por su capacidad de convertir visitas en pedidos reales.
