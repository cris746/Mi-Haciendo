# Documentación de API Endpoints - Mi Hacienda

URL Base: `http://localhost:3001/api`

## Autenticación (Auth)
- `POST /api/auth/login`: Autentica a un usuario y devuelve JWT.
- `GET /api/auth/me`: Retorna los datos del usuario autenticado (requiere Token).
- `POST /api/auth/register`: (Solo ADMIN) Registra nuevos usuarios.

## Dashboard
- `GET /api/dashboard`: Retorna KPIs, alertas de inventario, últimos movimientos y resumen general (varía según el rol autenticado).

## Animales
- `GET /api/animales`: Lista todos los animales con filtros (estado, raza, etc.).
- `POST /api/animales`: Registra un nuevo animal.
- `GET /api/animales/:id`: Detalle completo de un animal.
- `PUT /api/animales/:id`: Actualiza datos de un animal.
- `PATCH /api/animales/:id/estado`: Actualiza estado (ej. de ACTIVO a MUERTO).
- `GET /api/animales/:id/genealogy`: Árbol genealógico ascendente.
- `GET /api/animales/:id/descendencia`: Descendientes del animal.
- `GET /api/animales/razas`: Lista de razas disponibles.
- `GET /api/animales/categorias`: Lista de categorías.

## Parcelas y Movimientos
- `GET /api/parcelas`: Lista de parcelas.
- `POST /api/parcelas`: Crea parcela.
- `GET /api/movimientos`: Historial de traslados.
- `POST /api/movimientos`: Registra cambio de parcela de un animal.

## Sanidad
- `GET /api/sanidad/tratamientos`: Lista tratamientos.
- `POST /api/sanidad/tratamientos`: Crea nuevo tratamiento (preventivo/curativo).
- `PUT /api/sanidad/tratamientos/:id/estado`: Finaliza o anula tratamiento.
- `GET /api/sanidad/tratamientos/:id/aplicaciones`: Ver calendario del tratamiento.
- `POST /api/sanidad/tratamientos/:id/aplicaciones`: Registra dosis aplicada y descuenta inventario.

## Inventario
- `GET /api/inventario/alimentos`: Lista alimentos y stock.
- `POST /api/inventario/alimentos`: Registra nuevo alimento.
- `GET /api/inventario/medicamentos`: Lista medicamentos y stock.
- `POST /api/inventario/medicamentos`: Registra nuevo medicamento.
- `GET /api/inventario/resumen`: Totales para dashboard.
- `GET /api/inventario/kardex`: Movimientos IN/OUT de inventario general.
- `POST /api/inventario/alimentacion`: Registra consumo de alimento.

## Compras
- `GET /api/compras`: Lista compras registradas.
- `POST /api/compras`: Genera compra y suma al inventario.
- `GET /api/compras/:id`: Detalle de una compra.
- `PATCH /api/compras/:id/anular`: Anula compra (revierte inventario).
- `GET /api/proveedores`: Lista proveedores.
- `POST /api/proveedores`: Crea proveedor.

## Ventas
- `GET /api/ventas`: Lista ventas registradas.
- `POST /api/ventas`: Genera venta por peso y cambia animales a VENDIDO.
- `GET /api/ventas/:id`: Detalle de la venta.
- `PATCH /api/ventas/:id/anular`: Anula venta (revierte animales a ACTIVO).
- `GET /api/clientes`: Lista clientes.
- `POST /api/clientes`: Crea cliente.

## Reportes (Solo ADMIN o accesos parciales)
- `GET /api/reportes/ventas`
- `GET /api/reportes/compras`
- `GET /api/reportes/ganancias`
- `GET /api/reportes/animales`
- `GET /api/reportes/inventario`
- `GET /api/reportes/sanidad`
- `GET /api/reportes/stock-alertas`

## Notas de Roles
- **ADMIN**: Acceso global.
- **VETERINARIO**: Acceso principal a `animales`, `sanidad`, e inventario de `medicamentos`.
- **VENDEDOR**: Acceso a `compras`, `ventas`, `clientes`, `proveedores`.
