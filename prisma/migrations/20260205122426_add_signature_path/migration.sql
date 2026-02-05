-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "checkoutSignaturePath" TEXT,
ADD COLUMN     "checkoutSignedAt" TIMESTAMP(3);
