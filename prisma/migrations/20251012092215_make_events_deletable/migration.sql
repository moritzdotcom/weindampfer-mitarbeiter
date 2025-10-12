-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftChangeRequest" DROP CONSTRAINT "ShiftChangeRequest_shiftId_fkey";

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftChangeRequest" ADD CONSTRAINT "ShiftChangeRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
