import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Button,
  AvatarGroup,
  Avatar,
  DialogActions,
} from '@mui/material';
import { formatEventDate, formatEventTime } from '@/lib/event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DialogTransition from '../dialogs/transition';
import axios from 'axios';
import { showError, showSuccess } from '@/lib/toast';
import { ApiPostRegistrationResponse } from '@/pages/api/registrations';

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
  };
  onRegister: (registration: ApiPostRegistrationResponse) => void;
};

export default function UpcomingEventCard({
  event,
  onRegister,
}: UpcomingEventCardProps) {
  const [open, setOpen] = useState(false);
  const [helpsSetup, setHelpsSetup] = useState(false);
  const [helpsTeardown, setHelpsTeardown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post<ApiPostRegistrationResponse>(
        '/api/registrations',
        {
          eventId: event.id,
          helpsSetup,
          helpsTeardown,
        }
      );
      showSuccess('Erfolgreich für das Event eingetragen');
      onRegister(data);
    } catch (error) {
      console.error('Error registering for event:', error);
      showError('Fehler beim Eintragen für das Event');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="bg-gray-900 p-5 rounded-2xl shadow-md text-white">
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
          '.MuiAvatar-root': { borderColor: 'var(--color-gray-900)' },
        }}
      >
        {event.registrations.map(({ user }) => (
          <Avatar key={user.id} src={user.image || undefined} alt={user.name}>
            {user.name?.[0]?.toUpperCase() || '👤'}
          </Avatar>
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
        onClick={() => setOpen(true)}
      >
        Für Event eintragen
      </Button>

      <Dialog
        slots={{ transition: DialogTransition }}
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
          Für Event eintragen
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-4 mt-2 mb-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpsSetup}
                  onChange={(e) => setHelpsSetup(e.target.checked)}
                />
              }
              label="Ich helfe beim Aufbau"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpsTeardown}
                  onChange={(e) => setHelpsTeardown(e.target.checked)}
                />
              }
              label="Ich helfe beim Abbau"
            />
          </div>
          <DialogActions>
            <Button fullWidth onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              loading={loading}
              variant="contained"
              fullWidth
              onClick={handleSubmit}
            >
              Verbindlich eintragen
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
}
