-- AlterTable
ALTER TABLE "DetalleVenta" ADD COLUMN     "pesoVenta" DOUBLE PRECISION,
ADD COLUMN     "precioKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "fechaAnulacion" TIMESTAMP(3),
ADD COLUMN     "motivoAnulacion" TEXT,
ADD COLUMN     "numeroFactura" TEXT,
ADD COLUMN     "observacion" TEXT;
