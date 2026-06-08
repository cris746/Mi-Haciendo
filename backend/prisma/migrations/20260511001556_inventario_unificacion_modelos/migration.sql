-- AlterTable
ALTER TABLE "Alimento" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "precioCompra" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Medicamento" ALTER COLUMN "stockCantidad" SET DATA TYPE DOUBLE PRECISION;
