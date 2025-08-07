import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowBackIos } from '@mui/icons-material';
import { Session } from '@/hooks/useSession';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { differenceInMinutes } from 'date-fns';
import ProfileEventCard from '@/components/events/cardProfile';
import { ApiGetRegistrationsResponse } from '../api/registrations';
import axios from 'axios';
import { calculatePersonalTip } from '@/lib/shift';
import { CircularProgress, Divider } from '@mui/material';
import { ApiPostShiftChangeRequestResponse } from '../api/shifts/[shiftId]/changeRequest';

export default function ProfilePage({ session }: { session: Session }) {
  useAuthGuard(session);
  const [registrations, setRegistrations] =
    useState<ApiGetRegistrationsResponse>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await axios.get<ApiGetRegistrationsResponse>(
        '/api/registrations'
      );
      setRegistrations(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const registrationsWithShifts = useMemo(
    () =>
      registrations
        .filter((r) => r.shift)
        .sort(
          (a, b) =>
            new Date(b.event.date).getTime() - new Date(a.event.date).getTime()
        ),
    [registrations]
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const yearlyMinutes = useMemo(() => {
    return registrationsWithShifts.reduce((sum, { shift }) => {
      if (!shift?.clockIn || !shift.clockOut) return sum;
      const ci = new Date(shift.clockIn);
      const co = new Date(shift.clockOut);
      if (ci.getFullYear() === currentYear) {
        return sum + differenceInMinutes(co, ci);
      }
      return sum;
    }, 0);
  }, [registrationsWithShifts]);

  const yearlyHours = (yearlyMinutes / 60).toFixed(1);

  const monthlyMinutes = useMemo(() => {
    return registrationsWithShifts.reduce((sum, { shift }) => {
      if (!shift?.clockIn || !shift.clockOut) return sum;
      const ci = new Date(shift.clockIn);
      const co = new Date(shift.clockOut);
      if (ci.getFullYear() === currentYear && ci.getMonth() === currentMonth) {
        return sum + differenceInMinutes(co, ci);
      }
      return sum;
    }, 0);
  }, [registrationsWithShifts, currentMonth, currentYear]);

  const monthlyHours = (monthlyMinutes / 60).toFixed(1);

  const onChangeRequest = (request: ApiPostShiftChangeRequestResponse) => {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.shift?.id === request.shiftId
          ? { ...r, shift: { ...r.shift, changeRequest: request } }
          : r
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <Link
        className="text-white text-lg py-2 inline-flex items-center"
        href="/"
        title="Zurück zur Startseite"
      >
        <ArrowBackIos fontSize="inherit" />
        Zur Startseite
      </Link>

      <h1 className="text-3xl font-extralight my-6 text-center font-cocogoose">
        Dein <b>Profil</b>
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-sm text-neutral-400">Stunden diesen Monat</p>
          <p className="text-xl font-bold">{monthlyHours} Std.</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-sm text-neutral-400">Stunden dieses Jahr</p>
          <p className="text-xl font-bold">{yearlyHours} Std.</p>
        </div>
      </div>

      <Link
        href="/profile/edit"
        className="block w-full py-3 rounded-md bg-gray-200 text-black text-center font-bold mb-6"
      >
        Profil bearbeiten
      </Link>

      {loading ? (
        <div className="w-full flex justify-center mt-10">
          <CircularProgress color="inherit" size={40} />
        </div>
      ) : registrationsWithShifts.length === 0 ? (
        <p className="text-center text-neutral-500">
          Du hast bisher an keinen Events teilgenommen.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Divider>Deine Events</Divider>
          {registrationsWithShifts.map((r) => (
            <ProfileEventCard
              key={r.id}
              eventName={r.event.name}
              eventDate={r.event.date}
              shift={r.shift}
              tipAmount={calculatePersonalTip(
                r.event.totalTip,
                r.shift,
                r.event.registrations.map((r) => r.shift)
              )}
              onChangeRequest={onChangeRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
