import { differenceInMinutes } from 'date-fns';

type SimpleShift = {
  clockIn: Date | null;
  clockOut: Date | null;
};

export const calculateMinutesWorked = (shift: SimpleShift | null) => {
  if (!(shift && shift.clockIn && shift.clockOut)) return null;
  const ci = new Date(shift.clockIn);
  const co = new Date(shift.clockOut);
  return differenceInMinutes(co, ci);
};

export const calculatePersonalTip = (
  totalTip: number | null,
  ownShift: (SimpleShift & { receivesTip: boolean }) | null,
  allShifts: ((SimpleShift & { receivesTip: boolean }) | null)[]
) => {
  if (!totalTip || !ownShift || !ownShift.receivesTip) return null;
  const totalMinutesWorked = allShifts
    .filter((s) => s?.receivesTip)
    .reduce((sum, shift) => {
      return sum + (calculateMinutesWorked(shift) || 0);
    }, 0);
  if (totalMinutesWorked == 0) return 0;
  const ownMinutesWorked = calculateMinutesWorked(ownShift) || 0;
  return Math.floor((totalTip * ownMinutesWorked) / totalMinutesWorked / 5) * 5;
};

export const formatShiftTime = (time: Date | string | null) => {
  if (!time) return '--:--';
  return new Date(time).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isSameMinute = (
  a: Date | string | null,
  b: Date | string | null
) => {
  if (!(a && b)) return false;
  return differenceInMinutes(a, b) === 0;
};
