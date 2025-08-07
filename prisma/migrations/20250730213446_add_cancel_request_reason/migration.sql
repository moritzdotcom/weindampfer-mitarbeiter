-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "cancelReason" TEXT;

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "receivesTip" BOOLEAN NOT NULL DEFAULT true;
