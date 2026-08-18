/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `EmailJob` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `EmailJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailJob" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmailJob_idempotencyKey_key" ON "EmailJob"("idempotencyKey");
