import { Button, AvatarGroup } from '@mui/material';
import { formatEventDate, formatEventTime } from '@/lib/event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventCardAnimationWrapper from './cardAnimationWrapper';
import { Session } from '@/hooks/useSession';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import useLocation from '@/hooks/useLocation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { showError, showSuccess } from '@/lib/toast';
import { ApiPostShiftResponse } from '@/pages/api/shifts';
import { ApiPutShiftResponse } from '@/pages/api/shifts/[shiftId]';
import UserAvatar from '../userAvatar';

type CurrentEventCardProps = {
  event: {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    registrations: {
      id: string;
      user: { id: string; name: string; image: string | null };
      shift?: {
        id: string;
        clockIn?: Date | null;
        clockOut?: Date | null;
      } | null;
    }[];
    peopleRequired: number;
  };
  session: Session;
  onCheckIn: (data: ApiPostShiftResponse) => void;
  onCheckOut: (data: ApiPutShiftResponse) => void;
};

export default function CurrentEventCard({
  event,
  session,
  onCheckIn,
  onCheckOut,
}: CurrentEventCardProps) {
  const { location, getLocation, error } = useLocation();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const registration = event?.registrations?.find(
    (r) => r.user.id === session?.user?.id
  );

  const checkInInit = async () => {
    setCheckingIn(true);
    getLocation();
  };

  const checkIn = async () => {
    if (!location || !registration) return;

    try {
      const { data } = await axios.post<ApiPostShiftResponse>(`/api/shifts`, {
        registrationId: registration.id,
        clockIn: new Date(),
        clockInLat: location.coords.latitude,
        clockInLon: location.coords.longitude,
      });
      onCheckIn(data);
      setCheckingIn(false);
      showSuccess('Erfolgreich eingecheckt!');
    } catch (error) {
      console.error('Check-in failed:', error);
      showError('Check-in fehlgeschlagen. Bitte versuche es erneut.');
      setCheckingIn(false);
    }
  };

  const checkOutInit = async () => {
    setCheckingOut(true);
    getLocation();
  };

  const checkOut = async () => {
    if (!location || !registration?.shift) return;

    try {
      const { data } = await axios.put<ApiPutShiftResponse>(
        `/api/shifts/${registration.shift.id}`,
        {
          clockOut: new Date(),
          clockOutLat: location.coords.latitude,
          clockOutLon: location.coords.longitude,
        }
      );
      onCheckOut(data);
      setCheckingOut(false);
      showSuccess('Erfolgreich ausgecheckt!');
    } catch (error) {
      console.error('Check-out failed:', error);
      showError('Check-out fehlgeschlagen. Bitte versuche es erneut.');
      setCheckingOut(false);
    }
  };

  useEffect(() => {
    if (location && registration && checkingIn) {
      checkIn();
    }
  }, [location, registration, checkingIn]);

  useEffect(() => {
    if (location && registration && checkingOut) {
      checkOut();
    }
  }, [location, registration, checkingOut]);

  useEffect(() => {
    if (error) {
      console.error('Location error:', error);
      if (error.code == 1) {
        showError(
          'Du hast den Zugriff auf deinen Standort blockiert. Bitte aktiviere ihn in den Browser-Einstellungen, um diese Funktion nutzen zu können.'
        );
      } else {
        showError(
          'Fehler beim Abrufen des Standorts. Bitte versuche es erneut.'
        );
      }
      setCheckingIn(false);
      setCheckingOut(false);
    }
  }, [error]);

  return (
    <EventCardAnimationWrapper>
      <div className="bg-neutral-900 p-5 rounded-2xl text-white">
        <h3 className="text-2xl font-light font-cocogoose mb-2 text-center">
          {event.name}
        </h3>

        <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
          <CalendarMonthIcon />
          <span>{formatEventDate(event.startTime)}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-300 text-sm mb-4">
          <AccessTimeIcon />
          <span>
            {formatEventTime(event.startTime)} -{' '}
            {formatEventTime(event.endTime)}
          </span>
        </div>

        <AvatarGroup
          max={8}
          sx={{
            mb: 1,
            justifyContent: 'flex-end',
            '.MuiAvatar-root': { borderColor: 'var(--color-stone-900)' },
          }}
        >
          {event.registrations.map(({ user }) => (
            <UserAvatar key={user.id} user={user} />
          ))}
        </AvatarGroup>

        <p className="text-sm text-gray-300 mb-4">
          {event.registrations.length}/{event.peopleRequired} Personen
          eingetragen
        </p>

        <div className="flex flex-col gap-4">
          {/* Case 1: No clock In -> Button to check in now */}
          {registration && !registration?.shift?.clockIn && (
            <Button
              variant="contained"
              fullWidth
              loading={checkingIn}
              disabled={checkingIn}
              color="secondary"
              onClick={checkInInit}
              startIcon={<LoginIcon />}
            >
              Jetzt einchecken
            </Button>
          )}

          {/* Case 2: Clocked in but not clocked out -> Button to clock out */}
          {registration?.shift?.clockIn && !registration.shift.clockOut && (
            <Button
              variant="contained"
              fullWidth
              loading={checkingOut}
              disabled={checkingOut}
              color="warning"
              onClick={checkOutInit}
              startIcon={<LogoutIcon />}
            >
              Jetzt auschecken
            </Button>
          )}

          {/* Case 3: Already clocked out -> Show message */}
          {registration?.shift?.clockIn && registration.shift.clockOut && (
            <p className="text-sm text-gray-300 text-center">
              Du hast dich um
              <span className="text-white mx-1">
                {formatEventTime(registration.shift.clockOut)}
              </span>
              ausgecheckt
            </p>
          )}

          {registration && (
            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#ffffff',
                color: '#111111',
                '&:hover': { backgroundColor: '#dddddd' },
              }}
              href={`/registrations/${registration?.id}`}
            >
              Event ansehen
            </Button>
          )}
        </div>
      </div>
    </EventCardAnimationWrapper>
  );
}
