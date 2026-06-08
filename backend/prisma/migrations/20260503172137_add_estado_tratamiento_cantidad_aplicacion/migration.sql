-- AlterTable
ALTER TABLE "AplicacionMedicamento" ADD COLUMN     "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Tratamiento" ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;
