/*
  Warnings:

  - You are about to drop the column `stock` on the `Alimento` table. All the data in the column will be lost.
  - You are about to drop the column `unidad` on the `Alimento` table. All the data in the column will be lost.
  - You are about to drop the column `arete` on the `Animal` table. All the data in the column will be lost.
  - You are about to drop the column `edadIngreso` on the `Animal` table. All the data in the column will be lost.
  - You are about to drop the column `foto` on the `Animal` table. All the data in the column will be lost.
  - The `estado` column on the `Animal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `descripcion` on the `DetalleCompra` table. All the data in the column will be lost.
  - You are about to drop the column `peso` on the `DetalleVenta` table. All the data in the column will be lost.
  - You are about to drop the column `precioTotal` on the `DetalleVenta` table. All the data in the column will be lost.
  - You are about to drop the column `precioUnitario` on the `DetalleVenta` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `unidad` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `Parcela` table. All the data in the column will be lost.
  - You are about to drop the column `rol` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cliente` on the `Venta` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nroArete]` on the table `Animal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stockCantidad` to the `Alimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidadMedida` to the `Alimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nroArete` to the `Animal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `DetalleCompra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cantidad` to the `DetalleVenta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precio` to the `DetalleVenta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `DetalleVenta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockCantidad` to the `Medicamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidadMedida` to the `Medicamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VETERINARIO', 'VENDEDOR');

-- DropForeignKey
ALTER TABLE "DetalleVenta" DROP CONSTRAINT "DetalleVenta_animalId_fkey";

-- DropIndex
DROP INDEX "Animal_arete_key";

-- AlterTable
ALTER TABLE "Alimentacion" ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Alimento" DROP COLUMN "stock",
DROP COLUMN "unidad",
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stockCantidad" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unidadMedida" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Animal" DROP COLUMN "arete",
DROP COLUMN "edadIngreso",
DROP COLUMN "foto",
ADD COLUMN     "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nroArete" TEXT NOT NULL,
ADD COLUMN     "vendido" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "estado",
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "AplicacionMedicamento" ALTER COLUMN "dosis" SET DATA TYPE TEXT,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "DetalleCompra" DROP COLUMN "descripcion",
ADD COLUMN     "alimentoId" INTEGER,
ADD COLUMN     "medicamentoId" INTEGER,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "DetalleVenta" DROP COLUMN "peso",
DROP COLUMN "precioTotal",
DROP COLUMN "precioUnitario",
ADD COLUMN     "cantidad" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "precio" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "animalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Diagnostico" ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Medicamento" DROP COLUMN "stock",
DROP COLUMN "unidad",
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stockCantidad" INTEGER NOT NULL,
ADD COLUMN     "unidadMedida" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Movimiento" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "fechaIngreso" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Parcela" DROP COLUMN "ubicacion",
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "imagen" TEXT,
ADD COLUMN     "tamano" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Raza" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Tratamiento" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "fechaInicio" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rol",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VENDEDOR';

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "cliente",
ADD COLUMN     "clienteId" INTEGER NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Veterinario" ADD COLUMN     "email" TEXT,
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "Rol";

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Animal_nroArete_key" ON "Animal"("nroArete");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCompra" ADD CONSTRAINT "DetalleCompra_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCompra" ADD CONSTRAINT "DetalleCompra_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
