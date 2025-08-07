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
import { GetServerSidePropsContext } from 'next';
import prisma from '@/lib/prismadb';

export default function UserProfilePage({
  session,
  user,
}: {
  session: Session;
  user: { id: string; name: string };
}) {
  useAuthGuard(session, 'ADMIN');
  const [registrations, setRegistrations] =
    useState<ApiGetRegistrationsResponse>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await axios.get<ApiGetRegistrationsResponse>(
        `/api/registrations?userId=${user.id}`
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
        href="/admin/users"
        title="Zurück"
      >
        <ArrowBackIos fontSize="inherit" />
        Zurück
      </Link>

      <h1 className="text-3xl font-extralight my-6 text-center font-cocogoose">
        {user.name}
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

      {loading ? (
        <div className="w-full flex justify-center mt-10">
          <CircularProgress color="inherit" size={40} />
        </div>
      ) : registrationsWithShifts.length === 0 ? (
        <p className="text-center text-neutral-500">
          {user.name} hat bisher an keinen Events teilgenommen.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Divider>Teilgenommene Events</Divider>
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
              admin
            />
          ))}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { userId } = context.query;
  if (typeof userId !== 'string') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
    },
  });

  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: { user: { id: userId, name: user.name } } };
}
