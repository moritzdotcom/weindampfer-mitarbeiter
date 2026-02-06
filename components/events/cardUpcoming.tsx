import { useState } from 'react';
import { Button, AvatarGroup } from '@mui/material';
import { formatEventDate, formatEventTime } from '@/lib/event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { ApiPostRegistrationResponse } from '@/pages/api/registrations';
import RegisterDialog from '../dialogs/registerDialog';
import UserAvatar from '../userAvatar';
import { showInfo } from '@/lib/toast';

type UpcomingEventCardProps = {
  event: {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    registrations: {
      user: { id: string; name: string; image: string | null };
    }[];
    peopleRequired: number;
    setupRequired: boolean;
    teardownRequired: boolean;
  };
  onRegister: (registration: ApiPostRegistrationResponse) => void;
};

export default function UpcomingEventCard({
  event,
  onRegister,
}: UpcomingEventCardProps) {
  const [open, setOpen] = useState(false);

  function handleClickRegister() {
    if (event.registrations.length >= event.peopleRequired) {
      showInfo('Event ist voll');
    } else {
      setOpen(true);
    }
  }

  return (
    <div className="bg-neutral-900 p-5 rounded-2xl shadow-md text-white">
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
          {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
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
        {event.registrations.length}/{event.peopleRequired} Personen eingetragen
      </p>

      <Button
        variant="contained"
        fullWidth
        sx={{
          backgroundColor: '#ffffff',
          color: '#111111',
          '&:hover': { backgroundColor: '#dddddd' },
        }}
        onClick={handleClickRegister}
      >
        Für Event eintragen
      </Button>

      <RegisterDialog
        open={open}
        onClose={() => setOpen(false)}
        event={event}
        onRegister={onRegister}
      />
    </div>
  );
}
