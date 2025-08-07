import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowBackIos } from '@mui/icons-material';
import { Session } from '@/hooks/useSession';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import axios from 'axios';
import { Avatar, CircularProgress, Divider } from '@mui/material';
import { ApiGetRegistrationResponse } from '../api/registrations/[registrationId]';
import { GetServerSidePropsContext } from 'next';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatEventDate, formatEventTime } from '@/lib/event';

export default function RegistrationPage({
  session,
  registrationId,
}: {
  session: Session;
  registrationId: string;
}) {
  useAuthGuard(session);
  const [registration, setRegistration] =
    useState<ApiGetRegistrationResponse>();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await axios.get<ApiGetRegistrationResponse>(
        `/api/registrations/${registrationId}`
      );
      setRegistration(data);
    };
    fetchData();
  }, []);

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

      {registration ? (
        <div>
          <h1 className="text-3xl font-extralight my-6 text-center font-cocogoose">
            {registration?.event?.name}
          </h1>
          <div className="flex items-center gap-2 text-gray-300 mb-3 text-lg">
            <CalendarMonthIcon />
            <span>{formatEventDate(registration?.event?.startTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300 mb-4 text-lg">
            <AccessTimeIcon />
            <span>
              {formatEventTime(registration?.event?.startTime)} -{' '}
              {formatEventTime(registration?.event?.endTime)}
            </span>
          </div>
          <Divider>Mitarbeiter</Divider>
          <div className="grid gap-3 mt-3">
            {registration.event.registrations
              .sort((a, b) => a.user.name.localeCompare(b.user.name))
              .map((r) => {
                const isMe = r.user.id === session?.user?.id;
                return (
                  <div
                    key={r.user.id}
                    className={`flex items-center gap-4 bg-neutral-800 rounded-xl p-3 shadow ${
                      isMe ? 'border border-amber-500' : ''
                    }`}
                  >
                    <Avatar
                      src={r.user.image || undefined}
                      alt={r.user.name}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'var(--color-gray-400)',
                      }}
                    >
                      {r.user.name?.[0]?.toUpperCase() || '👤'}
                    </Avatar>

                    <div className="flex-1">
                      <p className="text-white text-lg font-medium">
                        {r.user.name} {isMe && '(Du)'}
                      </p>
                      <div className="text-sm text-gray-400 flex gap-2">
                        {r.helpsSetup && (
                          <span className="mt-1.5 px-2.5 py-0.5 bg-green-900/40 rounded-full text-green-300">
                            Aufbau
                          </span>
                        )}
                        {r.helpsTeardown && (
                          <span className="mt-1.5 px-2.5 py-0.5 bg-blue-900/40 rounded-full text-blue-300">
                            Abbau
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center mt-10">
          <CircularProgress color="inherit" size={40} />
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { registrationId } = context.query;
  if (!registrationId) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: { registrationId } };
}
