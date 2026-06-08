# Manual Técnico - Mi Hacienda

Este documento proporciona los detalles técnicos de la arquitectura y la implementación del ERP "Mi Hacienda" para facilitar el mantenimiento y escalamiento.

## 1. Arquitectura General
El sistema sigue un patrón Cliente-Servidor. El Backend expone una API REST y el Frontend es una Single Page Application (SPA). El Backend está estructurado usando principios de **Clean Architecture** para desacoplar responsabilidades.

## 2. Backend
- **Framework**: Express.js bajo Node.js.
- **Arquitectura de Módulos**:
  - `application`: Casos de uso (Lógica de negocio).
  - `infrastructure`: Controladores (Express), Repositorios (Prisma) y Rutas.
- **Seguridad**:
  - `Auth middleware`: Verifica validez del token JWT en cabeceras.
  - `Role middleware`: Restringe endpoints según los roles (`ADMIN`, `VETERINARIO`, `VENDEDOR`).
- **Base de Datos**: PostgreSQL gestionado mediante el ORM Prisma.

## 3. Frontend
- **Framework**: React 18 inicializado con Vite.
- **Comunicación HTTP**: Axios configurado con interceptores para inyectar automáticamente el token JWT y manejar errores `401`.
- **Estado Global**: `AuthContext` gestiona la sesión activa.
- **Enrutamiento**: React Router DOM (`AppRouter`), utilizando `PrivateRoute` para proteger vistas según rol.
- **Componentes Reutilizables Clave**:
  - `ConfirmModal` / `PromptModal`: Para acciones críticas.
  - `EmptyState`: Manejo de listas vacías profesional.
  - `LoadingSpinner`: Feedback visual de carga.
  - `PrintHeader`, `PrintReceipt`, `PrintAnimalRecord`: Utilidades para layouts de impresión PDF.

## 4. Módulos Backend
- `auth`: Autenticación y JWT.
- `livestock` / `animals`: Gestión de animales, razas y genealogía.
- `movimientos`: Gestión de parcelas e historial de traslados.
- `sanidad`: Control de tratamientos y calendario sanitario.
- `inventario`: Gestión de alimentos, medicamentos y Kardex.
- `compras`: Ingresos de inventario y proveedores.
- `ventas`: Flujo de salida de animales y clientes.
- `reportes`: Generación de datos estadísticos unificados.

## 5. Módulos Frontend
Reflejan estructuralmente los módulos del backend con sus respectivas interfaces de usuario (`dashboard`, `animales`, `movimientos`, `sanidad`, `inventario`, `compras`, `ventas`, `reportes`).

## 6. Base de Datos (Modelos Principales)
*No se incluye el Prisma Schema completo, sino una visión general de la relación:*
- **User**: Gestión de acceso (roles).
- **Animal**: Entidad central. Relacionado consigo mismo para genealogía (`madreId`, `padreId`). Relacionado con `Raza` y `Categoria`.
- **Parcela & Movimiento**: Rastreo físico. Un animal tiene muchos movimientos.
- **Tratamiento & AplicacionMedicamento**: Control sanitario sobre el animal, descontando del inventario cuando aplica.
- **Alimento & Medicamento**: Catálogos de inventario.
- **MovimientoInventario**: Registro inmutable de Kardex (tipo IN/OUT).
- **Compra, DetalleCompra & Proveedor**: Abastecimiento de inventario.
- **Venta, DetalleVenta & Cliente**: Comercialización de animales.

## 7. Flujos Críticos
- **Venta por peso**: Valida estado de animales, cambia estado a 'VENDIDO', genera la Venta y Detalle, no permite ventas en cero.
- **Anulación de venta**: Revierte el estado de los animales a 'ACTIVO' y marca la venta como 'ANULADA'.
- **Compra**: Registra la entrada financiera e inyecta movimientos 'IN' en el Kardex.
- **Anulación de compra**: Genera movimientos 'OUT' para compensar e invalidar la compra.
- **Kardex**: Se calcula sumando/restando `MovimientoInventario` vinculados a un ítem, garantizando la integridad.
- **Sanidad**: Al aplicar dosis, se genera un movimiento en inventario para descontar medicamentos de forma automática.
- **Impresión**: Las pantallas utilizan CSS puro (`@media print`) ocultando sidebars y navbars, priorizando tablas y membretes definidos.

## 8. Instalación Técnica
1. Instalar PostgreSQL y Node.js.
2. Configurar las variables de entorno (`.env` para la URI de la DB y `JWT_SECRET`).
3. Ejecutar `npm install` en ambas carpetas.
4. Generar Prisma Client: `npx prisma generate`.

## 9. Migraciones Prisma
Cualquier cambio en `schema.prisma` requiere ejecutar:
`npx prisma migrate dev --name descripcion_del_cambio`
Esto sincronizará la BD y actualizará el tipado.

## 10. Seed
Se cuenta con un archivo `seed.js` en Prisma para cargar razas, categorías y el usuario ADMIN por defecto en entornos frescos. Ejecutar con `npx prisma db seed`.

## 11. Despliegue Recomendado
- **Backend**: Render, Railway, DigitalOcean App Platform, o VPS (PM2).
- **Base de Datos**: Supabase, Render PostgreSQL o RDS.
- **Frontend**: Vercel, Netlify o Cloudflare Pages.

## 12. Respaldos
Es crítico programar `cron jobs` en el servidor de base de datos para generar dumps.
Comando básico de respaldo: `pg_dump -U usuario -h host base_datos > backup.sql`.
Restauración básica: `psql -U usuario -d base_datos < backup.sql`.

## 13. Seguridad
- **JWT_SECRET**: Debe ser un hash complejo en producción, no debe subirse a Git.
- **Roles Middleware**: El backend rechaza por diseño cualquier POST/PUT/DELETE si el token decodificado no posee el nivel correcto.
- **Sanitización Dashboard/Reportes**: Los endpoints evitan filtrar datos sensibles de los usuarios administradores hacia el frontend.
