# Plan UX/UI — Tienda Geek

**Objetivo:** diseñar una experiencia móvil primero que permita descubrir, evaluar y pedir productos coleccionables con confianza en menos de tres minutos.  
**Usuarios prioritarios:** fan/coleccionista que llega desde redes sociales, comprador de regalo y operador de tienda.

## 1. Principios de diseño

- **Producto primero:** fotos grandes, estado de stock, precio y CTA aparecen antes de información secundaria.
- **Coleccionable, no infantil:** base oscura o neutra, espacios limpios, contraste alto y acentos eléctricos controlados.
- **Confianza visible:** autenticidad, condición, stock, preventa, entrega y pago se explican cerca de la decisión de compra.
- **Móvil primero:** controles táctiles, barra inferior de compra y checkout de una sola columna.
- **Menos fricción:** compra como invitado, sin obligar a crear cuenta; WhatsApp solo después de registrar el pedido.
- **Accesible por defecto:** contraste AA, tipografía legible, foco visible, lenguaje claro y navegación por teclado.

## 2. Objetivos y métricas UX

| Objetivo | Señal de éxito |
| --- | --- |
| Encontrar productos | Uso de búsqueda/filtros y reducción de búsquedas sin resultados. |
| Evaluar con seguridad | Vistas de ficha que llegan a añadir al carrito. |
| Completar pedido | Conversión `begin_checkout → order_created`. |
| Evitar errores | Ningún intento de compra por encima del stock disponible. |
| Operar rápidamente | Un operador actualiza precio, variante o stock sin apoyo técnico. |

## 3. Arquitectura de información

### Navegación pública

```text
Inicio
├── Categorías
│   ├── Figuras y Funkos
│   ├── Manga y cómics
│   ├── Ropa y accesorios
│   └── Preventas
├── Franquicias
├── Ofertas
├── Novedades
├── Buscar
├── Carrito
└── Ayuda / Envíos / Contacto
```

### Navegación administrativa

```text
Pedidos
Productos
Inventario
Categorías y franquicias
Configuración
```

En el MVP no añadir navegación para funciones sin valor operativo inmediato, como reportes financieros complejos o campañas.

## 4. Flujos prioritarios

### Flujo A — Compra desde redes sociales

1. La persona abre una ficha compartida en Instagram, TikTok o WhatsApp.
2. Ve foto, nombre, precio, condición, disponibilidad y CTA sin desplazarse demasiado.
3. Elige variante/cantidad, añade al carrito y ve confirmación clara.
4. Completa datos mínimos, entrega y método de pago.
5. Recibe código de pedido, vencimiento de reserva e invitación para coordinar por WhatsApp.

**Regla UX:** no mostrar WhatsApp como sustituto del checkout; debe complementar un pedido ya creado.

### Flujo B — Exploración y filtrado

1. El usuario entra a categoría, franquicia o búsqueda.
2. Aplica filtros en un panel inferior móvil o lateral en escritorio.
3. Ve el número de resultados, chips de filtros activos y acción “Limpiar”.
4. Abre ficha y puede regresar conservando contexto y filtros.

### Flujo C — Operación de pedido

1. Operador abre la bandeja de pedidos pendientes.
2. Ve pago, tiempo restante de reserva, entrega y contacto.
3. Confirma pago o cancela con razón; el sistema muestra el efecto sobre stock.
4. Actualiza preparación/envío desde transiciones válidas y registra una nota interna.

## 5. Pantallas y contenido mínimo

| Pantalla | Contenido imprescindible | CTA principal |
| --- | --- | --- |
| Inicio | Hero con propuesta, categorías, novedades, ofertas, beneficios y confianza | Explorar catálogo |
| Catálogo | Título, contador, búsqueda, filtros, orden, tarjetas y vacío | Ver producto |
| Ficha | Galería, precio, estado, variante, stock, entrega, autenticidad, descripción y relacionados | Agregar al carrito |
| Carrito | Líneas editables, subtotal, aviso de stock, entrega estimada y total | Continuar pedido |
| Checkout | Resumen fijo, datos, entrega, pago, política y errores por campo | Crear pedido |
| Confirmación | Número, total, vencimiento, siguientes pasos y WhatsApp | Abrir WhatsApp |
| Admin pedidos | Filtros, tabla/lista, estados y alertas de reserva | Abrir pedido |
| Admin producto | Datos, variantes, fotos, publicación y movimientos de stock | Guardar/Publicar |

## 6. Sistema visual propuesto

### Dirección creativa

“Archivo de coleccionista contemporáneo”: superficies oscuras grafito, cards marfil claro, acentos violeta eléctrico y cian; ilustración o textura sutil de manga en áreas editoriales, nunca detrás de texto o fotos de producto.

### Tokens iniciales

| Token | Valor sugerido | Uso |
| --- | --- | --- |
| `surface` | `#0F1115` | Fondo principal oscuro. |
| `surface-raised` | `#1A1E27` | Header, drawer y tarjetas oscuras. |
| `paper` | `#F7F5F2` | Secciones claras y lectura larga. |
| `text-primary` | `#F8FAFC` / `#18181B` | Texto según superficie. |
| `brand` | `#8B5CF6` | Acción principal e identidad. |
| `accent` | `#22D3EE` | Filtros, información y detalles. |
| `sale` | `#F43F5E` | Oferta, nunca como único indicador. |
| `success` | `#22C55E` | Stock disponible / confirmación. |
| `warning` | `#F59E0B` | Preventa y stock limitado. |

Usar una fuente sans moderna (por ejemplo Inter o Manrope) y una fuente display solo para titulares puntuales. Tamaño de cuerpo mínimo 16 px en móvil; línea de texto máxima 65–75 caracteres en escritorio.

### Componentes base

- Header responsive, navegación móvil en drawer y barra de búsqueda.
- `ProductCard` con imagen 1:1, franquicia, nombre de dos líneas, precio, oferta y badge de estado.
- Badges semánticos: `Disponible`, `Últimas unidades`, `Agotado`, `Preventa`, `Oferta`, `Caja dañada`.
- Selector de variante, stepper de cantidad y CTA con estado de carga.
- Drawer de carrito, filtros, modal de imagen y toast accesible.
- Campos con label permanente, ayuda contextual y error asociado por `aria-describedby`.
- Skeletons que mantengan el tamaño final y no produzcan saltos visuales.

## 7. Reglas responsive

| Área | Móvil (< 768px) | Escritorio (≥ 1024px) |
| --- | --- | --- |
| Header | Logo, búsqueda compacta, menú y carrito | Navegación visible y buscador expandido |
| Catálogo | 2 columnas; filtros en bottom sheet | 3–4 columnas; filtros laterales |
| Ficha | Galería antes del detalle; CTA sticky inferior | Galería y compra en dos columnas; compra sticky |
| Carrito | Drawer de pantalla completa | Drawer lateral |
| Checkout | Una columna, resumen plegable | Formulario + resumen fijo |
| Admin | Lista compacta y acciones en menú | Tabla con filtros persistentes |

Objetivos táctiles: mínimo 44 × 44 px; no depender de hover; respetar zonas seguras y teclado móvil.

## 8. Estados que deben diseñarse antes de desarrollar

- Cargando, error de red, sin resultados y carrito vacío.
- Producto agotado, últimas unidades, preventa y variante no disponible.
- Precio actualizado o stock modificado durante checkout.
- Pedido creado, pedido ya enviado (idempotencia), reserva por vencer y reserva vencida.
- Permiso denegado, sesión administrativa expirada y carga de imagen fallida.

Cada estado debe indicar qué ocurrió, qué conserva el sistema y cuál es la siguiente acción; evitar mensajes técnicos.

## 9. Accesibilidad y confianza

- Contraste mínimo WCAG AA, foco visible y secuencia de tabulación lógica.
- Galería con texto alternativo útil y controles etiquetados.
- Precio normal, precio de oferta y descuento expresados también con texto, no solo color/tachado.
- Resumen de pedido legible antes de confirmar; enlaces a envío, cambios, autenticidad y preventas junto al CTA.
- No solicitar documento o correo si no son indispensables para la modalidad elegida.

## 10. Proceso de diseño

### Semana 1 — Descubrimiento y estructura

- Revisar catálogo, atributos reales, fotos, precios, envíos y casos de stock.
- Definir 3 perfiles, tareas críticas, tono de marca y contenidos obligatorios.
- Crear sitemap, flujos, wireframes en móvil y criterios de aceptación UX.

### Semana 2 — Sistema y alta fidelidad

- Crear tokens, tipografía, espaciado, componentes y estados.
- Diseñar Inicio, Catálogo, Ficha, Carrito y Checkout para móvil y escritorio.
- Prototipo navegable del flujo de compra.

### Semana 3 — Prueba y back-office

- Pruebas moderadas con 5 personas del público objetivo (encontrar, filtrar y pedir un producto).
- Corregir fricciones y diseñar Pedidos, Producto e Inventario admin.
- Entregar especificaciones y handoff de componentes/estados.

## 11. Criterios de aceptación UX del MVP

- En móvil, el usuario entiende qué se vende y puede llegar al catálogo en menos de un toque desde inicio.
- En ficha, precio, disponibilidad, condición y CTA son visibles antes de contenido secundario.
- Filtros y búsqueda conservan su estado al volver de una ficha.
- El checkout informa costes, método de pago, reserva y errores antes de crear el pedido.
- Todo control es utilizable con teclado y lector de pantalla básico.
- Las acciones críticas muestran feedback inmediato y no permiten duplicar pedidos.

## 12. Entregables

1. Sitemap e inventario de contenido.
2. Flujos y wireframes mobile-first.
3. Librería de componentes/tokens en Figma o equivalente.
4. Diseños responsive de las ocho pantallas prioritarias y todos sus estados.
5. Prototipo del flujo de compra y notas de accesibilidad.
6. Especificación de handoff: medidas, comportamiento, assets, textos, estados y eventos analíticos.

