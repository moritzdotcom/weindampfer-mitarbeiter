import HtmlHead from '@/components/head';
import { Session } from '@/hooks/useSession';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { ApiGetMyDataResponse } from './api/myData';
import { CircularProgress, Divider } from '@mui/material';
import {
  isUserRegistered,
  isUserNotRegistered,
  isCurrentEvent,
  hasOngoingShift,
  formatEventTime,
  eventSortFn,
} from '@/lib/event';
import UpcomingEventCard from '@/components/events/cardUpcoming';
import { ApiPostRegistrationResponse } from './api/registrations';
import RegisteredEventCard from '@/components/events/cardRegistered';
import CurrentEventCard from '@/components/events/cardCurrent';
import { ApiPostShiftResponse } from './api/shifts';
import Link from 'next/link';
import { ApiRegistrationCancelRequestResponse } from './api/registrations/[registrationId]/cancelRequest';

export default function Home({ session }: { session: Session }) {
  const router = useRouter();
  const [myData, setMyData] = useState<ApiGetMyDataResponse | null>(null);
  const userId = session?.user?.id;

  const onRegister = (registration: ApiPostRegistrationResponse) => {
    setMyData((prev) => {
      if (!prev) return null;

      return prev.map((event) => {
        if (event.id !== registration.eventId) return event;

        return {
          ...event,
          registrations: [...event.registrations, registration],
        };
      });
    });
  };

  const onUpdate = (registration: ApiRegistrationCancelRequestResponse) => {
    setMyData((prev) => {
      if (!prev) return null;

      return prev.map((event) => {
        if (event.id !== registration.eventId) return event;

        return {
          ...event,
          registrations: event.registrations.map((r) =>
            r.id == registration.id ? registration : r
          ),
        };
      });
    });
  };

  const onCheckIn = (data: ApiPostShiftResponse) => {
    setMyData((prev) => {
      if (!prev) return null;

      return prev.map((event) => {
        const registration = event.registrations.find(
          (r) => r.id === data.registrationId
        );

        if (!registration) return event;

        return {
          ...event,
          registrations: event.registrations.map((r) =>
            r.id === registration.id ? { ...r, shift: data } : r
          ),
        };
      });
    });
  };

  const fetchData = async () => {
    try {
      const { data } = await axios.get<ApiGetMyDataResponse>('/api/myData');
      setMyData(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific error messages from the API
        if (typeof error.response.data === 'string') {
          console.error('Error:', error.response.data);
        } else if (error.response.data.message) {
          console.error('Error:', error.response.data.message);
        }
      } else {
        // Handle general errors
        console.error('Unexpected error:', error);
      }
    }
  };

  const currentEvent = useMemo(() => {
    if (!myData || !userId) return null;

    return (
      myData.find(
        (event) => isCurrentEvent(event) && isUserRegistered(event, userId)
      ) ??
      myData.find((event) => hasOngoingShift(event, userId)) ??
      null
    );
  }, [myData, userId]);

  const registeredEvents = useMemo(() => {
    if (!myData || !userId) return [];
    return myData.filter(
      (event) =>
        isUserRegistered(event, userId) && currentEvent?.id !== event.id
    );
  }, [myData, userId, currentEvent]);

  const upcomingEvents = useMemo(() => {
    if (!myData || !userId) return [];
    return myData.filter(
      (event) =>
        isUserNotRegistered(event, userId) && currentEvent?.id !== event.id
    );
  }, [myData, userId, currentEvent]);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session.status === 'authenticated') {
      fetchData();
    }
  }, [session.status, router.isReady]);

  return (
    <>
      <HtmlHead />
      {session?.user?.role === 'ADMIN' && (
        <a
          className="block w-full px-4 py-2 text-center bg-gray-900 text-white"
          href="/admin"
        >
          Zum Admin Dashboard
        </a>
      )}
      <div className="w-full max-w-2xl mx-auto px-3 mt-10 mb-10 flex flex-col gap-7">
        <div>
          <img
            src="/logo-white.png"
            alt="WEINDAMPFER"
            className="w-64 mx-auto"
          />
          <h2 className="text-2xl text-center font-light font-cocogoose my-6">
            Schichtplanung
          </h2>
          <Link
            href="/profile"
            className="block w-full py-3 rounded-md bg-gray-200 text-black text-center font-bold"
          >
            Dein Profil
          </Link>
        </div>
        {myData ? (
          <>
            {currentEvent && (
              <div className="flex flex-col gap-4">
                <Divider>Aktuelle Veranstaltung</Divider>
                <CurrentEventCard
                  event={currentEvent}
                  session={session}
                  onCheckIn={onCheckIn}
                  onCheckOut={onCheckIn}
                />
              </div>
            )}

            {registeredEvents.length > 0 && (
              <div className="flex flex-col gap-4">
                <Divider>Meine Veranstaltungen</Divider>
                {registeredEvents.sort(eventSortFn).map((event) => (
                  <RegisteredEventCard
                    key={event.id}
                    event={event}
                    session={session}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div className="flex flex-col gap-4">
                <Divider>Zukünftige Veranstaltungen</Divider>
                {upcomingEvents.sort(eventSortFn).map((event) => (
                  <UpcomingEventCard
                    key={event.id}
                    event={event}
                    onRegister={onRegister}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <CircularProgress
            className="mx-auto mt-10"
            color="inherit"
            size={40}
          />
        )}
      </div>
    </>
  );
}
