# Sistema de diseño

## Marca StoreOS

- **Logotipo horizontal:** `front/public/brand/storeos-logo-horizontal.png`; úsalo en portadas, pie de página y comunicaciones con espacio suficiente para el slogan **“Tu negocio. Sin límites.”**
- **Marca compacta:** `storeos-mark-dark.png` y `storeos-mark-light.png`; úsala en navegación, formularios, favicon e interfaces con espacio reducido.
- **Color primario:** `#0B84F3`; azul claro `#36AEFF`; azul profundo `#0868C7`.
- No deformar, recolorear ni recrear el logo. En fondos oscuros usa la marca compacta oscura o el logotipo horizontal sobre una superficie blanca.

## Tokens iniciales

| Grupo | Regla |
| --- | --- |
| Color | `surface`, `paper`, `text`, `brand`, `accent`, `success`, `warning`, `danger`; contraste AA. |
| Tipografía | Escala semántica: display, heading, body, label, mono. |
| Espaciado | Escala 4/8/12/16/24/32/48/64. |
| Elevación | Tres niveles; no usar sombras como único indicador. |
| Movimiento | 150–250 ms, respeta `prefers-reduced-motion`. |
| Tema | Tokens semánticos para claro/oscuro; no colores hardcodeados en componentes. |

## Componentes base

Button, Input, Textarea, Card, Dialog, Drawer, Dropdown, Select, Checkbox, Radio, Switch, Toast, Tooltip, Avatar, Badge, Alert, Tabs, Accordion, Table, Pagination, Breadcrumb, Calendar, Uploader, RichText y ColorPicker.

Cada componente debe tener variantes, estados de carga/error/deshabilitado, foco visible, API documentada y prueba visual/accesible. No construir el builder visual hasta que estas primitivas estén estables.
