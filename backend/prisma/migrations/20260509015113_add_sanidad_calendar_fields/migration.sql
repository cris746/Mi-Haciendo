-- AlterTable
ALTER TABLE "AplicacionMedicamento" ADD COLUMN     "fechaSiguiente" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Medicamento" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "precioCompra" DOUBLE PRECISION;
