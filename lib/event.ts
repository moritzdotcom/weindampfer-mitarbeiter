import { RegistrationStatus } from '@/generated/prisma';

export function formatEventDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatEventTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fullEventName(event: { name: string; date: Date | string }) {
  return `${event.name} - ${formatEventDate(event.date)}`;
}

type EventType = {
  registrations: {
    userId: string;
    status: RegistrationStatus;
    shift?: {
      clockIn?: Date | null;
      clockOut?: Date | null;
    } | null;
  }[];
  startTime: Date;
  endTime: Date;
};

export const isUserRegistered = (event: EventType, userId: string) =>
  event.registrations.some(
    (r) => r.userId === userId && r.status !== 'CANCELLED'
  );

export const isUserNotRegistered = (event: EventType, userId: string) =>
  event.registrations.every((r) => r.userId !== userId);

export const isCurrentEvent = (event: EventType) => {
  const now = new Date();
  // Current is 4 hours before the start and 4 hours after the end
  const startThreshold = new Date(event.startTime);
  startThreshold.setHours(startThreshold.getHours() - 4);
  const endThreshold = new Date(event.endTime);
  endThreshold.setHours(endThreshold.getHours() + 4);
  return now >= startThreshold && now <= endThreshold;
};

export const hasOngoingShift = (event: EventType, userId: string) =>
  event.registrations.some(
    (r) => r.userId === userId && r.shift?.clockIn && !r.shift?.clockOut
  );

type SimpleEvent = { date: Date | string };

export function eventSortFn(a: SimpleEvent, b: SimpleEvent) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}
