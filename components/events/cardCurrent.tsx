import { Button, AvatarGroup } from '@mui/material';
import { formatEventDate, formatEventTime } from '@/lib/event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventCardAnimationWrapper from './cardAnimationWrapper';
import { Session } from '@/hooks/useSession';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { showError, showSuccess } from '@/lib/toast';
import { ApiPostShiftResponse } from '@/pages/api/shifts';
import { ApiPutShiftResponse } from '@/pages/api/shifts/[shiftId]';
import UserAvatar from '../userAvatar';
import SignatureDialog from '../dialogs/signatureDialog';

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
  const [locationError, setLocationError] =
    useState<GeolocationPositionError | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const registration = event?.registrations?.find(
    (r) => r.user.id === session?.user?.id,
  );

  const checkInInit = async () => {
    if (checkingIn || !registration) return;

    setLocationError(null);
    setCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        checkIn(position);
      },
      (err) => {
        setLocationError(err);
        checkIn();
      },
      { enableHighAccuracy: false },
    );
  };

  const checkIn = async (location?: GeolocationPosition) => {
    if (!registration) return;
    try {
      const { data } = await axios.post<ApiPostShiftResponse>(`/api/shifts`, {
        registrationId: registration.id,
        clockIn: new Date(),
        clockInLat: location?.coords?.latitude ?? null,
        clockInLon: location?.coords?.longitude ?? null,
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
    setSignatureOpen(true);
  };

  const checkOut = async (
    sigDataUrl: string,
    location?: GeolocationPosition,
  ) => {
    if (!registration?.shift) return;

    try {
      const { data } = await axios.put<ApiPutShiftResponse>(
        `/api/shifts/${registration.shift.id}`,
        {
          clockOut: new Date(),
          clockOutLat: location?.coords?.latitude || null,
          clockOutLon: location?.coords?.longitude || null,
          checkoutSignatureDataUrl: sigDataUrl,
        },
      );
      onCheckOut(data);
      setCheckingOut(false);
      setSignatureDataUrl(null);
      showSuccess('Erfolgreich ausgecheckt!');
    } catch (error) {
      console.error('Check-out failed:', error);
      showError('Check-out fehlgeschlagen. Bitte versuche es erneut.');
      setCheckingOut(false);
      setSignatureDataUrl(null);
    }
  };

  useEffect(() => {
    if (registration?.shift && checkingOut && signatureDataUrl) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          checkOut(signatureDataUrl, position);
        },
        (err) => {
          setLocationError(err);
          checkOut(signatureDataUrl);
        },
        { enableHighAccuracy: false },
      );
    }
  }, [registration?.shift, checkingOut, signatureDataUrl]);

  useEffect(() => {
    if (locationError) {
      console.error('Location error:', locationError);
      if (locationError.code == 1) {
        showError(
          'Du hast den Zugriff auf deinen Standort blockiert. Bitte aktiviere ihn in den Browser-Einstellungen.',
        );
      } else {
        showError('Fehler beim Abrufen des Standorts.');
      }
    }
  }, [locationError]);

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
        <SignatureDialog
          open={signatureOpen}
          onClose={() => {
            setSignatureOpen(false);
            setCheckingOut(false);
            setSignatureDataUrl(null);
          }}
          onConfirm={(dataUrl) => {
            setSignatureOpen(false);
            setSignatureDataUrl(dataUrl);
          }}
        />
      </div>
    </EventCardAnimationWrapper>
  );
}
