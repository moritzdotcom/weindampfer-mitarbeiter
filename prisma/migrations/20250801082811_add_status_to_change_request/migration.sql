/*
  Warnings:

  - You are about to drop the column `changeRequest` on the `ShiftChangeRequest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ShiftChangeRequest" DROP COLUMN "changeRequest",
ADD COLUMN     "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING';
