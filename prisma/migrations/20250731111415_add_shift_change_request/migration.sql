/*
  Warnings:

  - You are about to drop the column `changeApprovedBy` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `changeRequest` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `clockInCorrected` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `clockOutCorrected` on the `Shift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "changeApprovedBy",
DROP COLUMN "changeRequest",
DROP COLUMN "clockInCorrected",
DROP COLUMN "clockOutCorrected";

-- CreateTable
CREATE TABLE "ShiftChangeRequest" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "changeRequest" TEXT,
    "changeApprovedBy" TEXT,

    CONSTRAINT "ShiftChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftChangeRequest_shiftId_key" ON "ShiftChangeRequest"("shiftId");

-- AddForeignKey
ALTER TABLE "ShiftChangeRequest" ADD CONSTRAINT "ShiftChangeRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
