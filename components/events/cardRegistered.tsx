import {
  Button,
  AvatarGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { formatEventDate, formatEventTime } from '@/lib/event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Session } from '@/hooks/useSession';
import DialogTransition from '../dialogs/transition';
import { useState } from 'react';
import axios from 'axios';
import { showError, showSuccess } from '@/lib/toast';
import { ApiRegistrationCancelRequestResponse } from '@/pages/api/registrations/[registrationId]/cancelRequest';
import { RegistrationStatus } from '@/generated/prisma';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import UserAvatar from '../userAvatar';

type RegisteredEventCardProps = {
  event: {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    registrations: {
      id: string;
      status: RegistrationStatus;
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
  onUpdate: (data: ApiRegistrationCancelRequestResponse) => void;
};

export default function RegisteredEventCard({
  event,
  session,
  onUpdate,
}: RegisteredEventCardProps) {
  const registration = event?.registrations?.find(
    (r) => r.user.id === session?.user?.id,
  );

  const shift = registration?.shift;

  const [dialogOpen, setDialogOpen] = useState(false);

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

      {registration && (
        <div className="flex flex-col gap-3">
          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#ffffff',
              color: '#111111',
              '&:hover': { backgroundColor: '#dddddd' },
            }}
            href={`/registrations/${registration.id}`}
          >
            Event ansehen
          </Button>
          {registration.status == 'CANCEL_REQUESTED' ? (
            <div className="rounded-md p-3 bg-gray-700 flex gap-3 items-center">
              <InfoOutlineIcon />
              <p>Deine Anfrage zur Abmeldung steht noch aus.</p>
            </div>
          ) : shift?.clockIn ? null : (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setDialogOpen(true)}
            >
              Von Event abmelden
            </Button>
          )}
        </div>
      )}
      {shift && shift.clockIn && (
        <p className="text-left text-sm text-gray-300 mt-3">
          Check-In:
          <span className="text-white mx-1">
            {formatEventTime(shift.clockIn)}
          </span>
        </p>
      )}
      {shift && shift.clockOut && (
        <p className="text-left text-sm text-gray-300 mt-1">
          Check-Out:
          <span className="text-white mx-1">
            {formatEventTime(shift.clockOut)}
          </span>
        </p>
      )}
      {registration && (
        <UnregisterDialog
          registrationId={registration.id}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

type UnregisterDialogProps = {
  registrationId: string;
  open: boolean;
  onClose: () => void;
  onUpdate: (data: ApiRegistrationCancelRequestResponse) => void;
};

function UnregisterDialog({
  registrationId,
  open,
  onClose,
  onUpdate,
}: UnregisterDialogProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setReason('');
    setReasonError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (reason.length < 2) {
      setReasonError('Grund muss angegeben werden');
    } else {
      try {
        setLoading(true);
        const { data } = await axios.post<ApiRegistrationCancelRequestResponse>(
          `/api/registrations/${registrationId}/cancelRequest`,
          { reason },
        );
        onUpdate(data);
        showSuccess('Anfrage gesendet');
        handleClose();
      } catch (error) {
        showError('Abmelden nicht möglich');
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <Dialog
      slots={{ transition: DialogTransition }}
      open={open}
      onClose={handleClose}
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Von Event abmelden
      </DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-3">
          <p>Gib hier den Grund an, warum du dich austragen möchtest.</p>
          <TextField
            fullWidth
            label="Grund"
            value={reason}
            required
            error={Boolean(reasonError)}
            helperText={reasonError}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button fullWidth onClick={handleClose}>
          Abbrechen
        </Button>
        <Button
          loading={loading}
          variant="contained"
          fullWidth
          onClick={handleSubmit}
        >
          Absenden
        </Button>
      </DialogActions>
    </Dialog>
  );
}
