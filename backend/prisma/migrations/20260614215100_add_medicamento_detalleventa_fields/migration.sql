-- Add missing fields for DetalleVenta
ALTER TABLE "DetalleVenta" ADD COLUMN IF NOT EXISTS "precioCompraAnimal" DECIMAL(12,2);
ALTER TABLE "DetalleVenta" ADD COLUMN IF NOT EXISTS "gananciaAnimal" DECIMAL(12,2);

-- Add presentation fields for Medicamento
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "codigo" TEXT;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "presentacion" TEXT;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "unidadCompra" TEXT;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "contenidoPorUnidad" DOUBLE PRECISION;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "unidadBase" TEXT;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "stockUnidades" DOUBLE PRECISION;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "stockTotalBase" DOUBLE PRECISION;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "precioCompraUnidad" DOUBLE PRECISION;
ALTER TABLE "Medicamento" ADD COLUMN IF NOT EXISTS "lote" TEXT;