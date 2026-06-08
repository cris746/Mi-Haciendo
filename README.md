# Mi Hacienda / Mi-Haciendo 🐄

ERP ganadero full-stack profesional para la administración de animales, sanidad, inventario, compras, ventas, reportes e impresión documental.

## 🌟 Características Principales

- **Gestión de animales**: Registro completo, razas, categorías y genealogía.
- **Parcelas y movimientos**: Control de ubicación y rotación de ganado.
- **Sanidad y calendario sanitario**: Tratamientos, vacunaciones, control de dosis y alertas.
- **Inventario**: Control de alimentos y medicamentos, cálculo de Kardex, gestión de vencimientos.
- **Compras**: Registro de compras, gestión de proveedores, ingreso a inventario, comprobantes.
- **Ventas por peso**: Gestión de ventas de animales por kilogramo, cálculo automático, clientes.
- **Dashboard profesional**: KPIs, alertas, actividad reciente, gráficos de rendimiento.
- **Reportes avanzados**: Exportación en CSV, filtros de fechas, control de ganancias.
- **Impresión Profesional Documental**:
  - Reportes de stock.
  - Notas de venta.
  - Comprobantes de compra.
  - Expediente del animal.
  - Historia clínica imprimible.
- **Roles y Seguridad**:
  - `ADMIN`: Acceso total.
  - `VETERINARIO`: Acceso a sanidad, animales e inventario médico.
  - `VENDEDOR`: Acceso a ventas, clientes y compras.
- **UX Premium**: Interfaz responsive, alertas modales, confirmaciones robustas y estados visuales para evitar errores de usuario.

## 🛠️ Tecnologías

**Backend:**
- Node.js & Express
- Prisma ORM
- PostgreSQL
- JWT & bcryptjs
- Clean Architecture

**Frontend:**
- React 18 & Vite
- Tailwind CSS (Premium UI)
- Axios (Interceptors)
- Lucide React (Iconografía)

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL corriendo localmente o en servidor (puerto 5432)
- npm / npx
- Prisma CLI (integrado en el proyecto)

## 🚀 Instalación desde cero

### Backend

```bash
cd backend
npm install
# Copiar variables de entorno
cp .env.example .env
# Generar cliente y correr migraciones
npx prisma migrate dev
# Opcional: poblar datos base si el seed existe
npx prisma db seed
# Iniciar servidor
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Copiar variables de entorno
cp .env.example .env
# Iniciar aplicación
npm run dev
```

## 📦 Variables de Entorno

El proyecto requiere variables de entorno en ambos entornos:
- **Backend**: Ver `backend/.env.example` para los detalles de conexión a base de datos y secretos JWT.
- **Frontend**: Ver `frontend/.env.example` para la configuración de la URL de la API.

## 👥 Usuarios / Roles

El sistema utiliza Control de Acceso Basado en Roles (RBAC):
- **ADMIN**: Control total de configuraciones, finanzas, inventarios y reportes completos.
- **VETERINARIO**: Especialista médico, solo visualiza stock pertinente, y gestiona sanidad y animales.
- **VENDEDOR**: Encargado de ingresos y egresos, operando compras, ventas, clientes y proveedores.

## 📁 Módulos del Sistema

1. **Dashboard**: Panel principal con métricas resumidas y alertas.
2. **Animales**: Control del ganado y su genealogía.
3. **Movimientos**: Traslados de ganado entre parcelas (lotes).
4. **Sanidad**: Control de vacunas, tratamientos y calendario.
5. **Inventario**: Alimentos y medicamentos (entradas y salidas).
6. **Compras & Ventas**: Flujo comercial integral con comprobantes.
7. **Reportes**: Analítica y estado financiero exportable.

## 🖨️ Impresión y Documentos

El sistema incluye vistas de impresión optimizadas (CSS `@media print`). Todos los documentos (historia clínica, notas de venta, reportes) se visualizan en el navegador con diseño formal y pueden guardarse directamente como archivos **PDF** utilizando la función nativa de impresión del navegador (`Ctrl + P` o `Cmd + P`).

## 🏗️ Estructura de Carpetas

```
Mi-Haciendo/
├── backend/          # API REST
│   ├── docs/         # Documentación de API
│   ├── prisma/       # Schema y migraciones
│   └── src/          # Código fuente (Clean Architecture)
├── docs/             # Manuales y documentación técnica del proyecto
└── frontend/         # SPA React
    └── src/          # Componentes, vistas y contexto
```

## 📌 Estado del Proyecto

**Estado: Listo para entrega profesional.** (FASE 10 completada).
El proyecto cuenta con todas las funcionalidades solicitadas, interfaces pulidas y seguridad implementada.