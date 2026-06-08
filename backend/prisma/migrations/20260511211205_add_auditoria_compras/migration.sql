-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "fechaAnulacion" TIMESTAMP(3),
ADD COLUMN     "motivoAnulacion" TEXT,
ADD COLUMN     "numeroFactura" TEXT,
ADD COLUMN     "observacion" TEXT;
