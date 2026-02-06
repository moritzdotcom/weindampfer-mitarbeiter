-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "setupRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teardownRequired" BOOLEAN NOT NULL DEFAULT false;
