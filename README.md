# PostresYa 🍰

Plataforma web para pedidos personalizados de repostería, inspirada en ISA CAKE SV.

**Enlace de despliegue:** https://postresya-web.vercel.app

## Descripción

PostresYa permite a los clientes explorar un catálogo de postres, armar pedidos personalizados (tamaño y fecha de entrega) con precio calculado dinámicamente, y dar seguimiento al estado de sus pedidos. La administradora gestiona todos los pedidos desde un dashboard con estadísticas y gráfica.

## Tecnologías

- **Frontend:** React + Next.js (App Router), Tailwind CSS
- **Manejo de estado:** Context API (autenticación de usuario)
- **Backend:** API REST propia con Route Handlers de Next.js
- **Gráficas:** Recharts
- **Despliegue:** Vercel

## Arquitectura (capas)

- **Capa de datos** (`src/app/lib/data.js`): datos semilla (productos, usuarios, pedidos).
- **Capa de lógica/API** (`src/app/api/**`): rutas REST que validan y procesan la información (login, registro, productos, pedidos).
- **Capa de UI** (`src/app/**/page.js`, `src/app/components`): páginas y componentes visuales, conectados a la API mediante Axios y al estado global mediante Context API (`AuthContext`).

## Roles de usuario

| Rol | Permisos |
|---|---|
| **Cliente** | Ver catálogo, hacer pedidos personalizados, ver el estado de sus propios pedidos. |
| **Administradora** | Ver dashboard con estadísticas y gráfica, actualizar el estado de cualquier pedido. |

**Cuenta de administradora de prueba:** `admin@postresya.com` / `admin123`

## Requerimientos funcionales implementados

1. ✅ Módulo de autenticación (registro, login, rutas protegidas por rol)
2. ✅ Módulo de gestión principal (creación y seguimiento de pedidos, actualización de estado)
3. ✅ Procesamiento de lógica de negocio central (cálculo de precio dinámico por tamaño, validación de anticipación mínima de 2 días)
4. ✅ Dashboard con vista resumen (total de pedidos, ingresos, gráfica por estado)
5. ✅ Actualización dinámica de datos en ejecución (la lista de pedidos del cliente y del dashboard se refresca automáticamente cada 5 segundos)

## Cómo correr el proyecto localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

Abrir [http://localhost:3000](http://localhost:3000)

## Equipo

- Mariana Flores
- Alexander Rosales