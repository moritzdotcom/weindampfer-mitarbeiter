import { format, isBefore, subWeeks } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoIcon from '@mui/icons-material/Info';
import { calculateMinutesWorked } from '@/lib/shift';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import axios from 'axios';
import DialogTransition from '../dialogs/transition';
import { ApiPostShiftChangeRequestResponse } from '@/pages/api/shifts/[shiftId]/changeRequest';
import TimeRangePicker from '../timeRangePicker';
import { ShiftChangeRequest } from '@/generated/prisma';
import { Check, Close, InfoOutline } from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useRouter } from 'next/router';

type ProfileEventCardProps = {
  eventName: string;
  eventDate: Date;
  shift: {
    id: string;
    registrationId: string;
    clockIn: Date | null;
    clockOut: Date | null;
    changeRequest: ShiftChangeRequest | null;
  } | null;
  tipAmount?: number | null;
  onChangeRequest: (request: ApiPostShiftChangeRequestResponse) => void;
  admin?: boolean;
};

export default function ProfileEventCard({
  eventName,
  eventDate,
  shift,
  tipAmount,
  onChangeRequest,
  admin,
}: ProfileEventCardProps) {
  const hasShift = shift?.clockIn && shift?.clockOut;
  const workedMinutes = calculateMinutesWorked(shift) || 0;
  const hours = Math.floor(workedMinutes / 60);
  const minutes = workedMinutes % 60;
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClickChangeRequest = () => {
    const oneWeekAgo = subWeeks(new Date(), 1);
    if (isBefore(eventDate, oneWeekAgo)) {
      showError('Korrektur nur innerhalb einer Woche möglich');
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-2xl p-4 shadow-md text-white border-2 border-gray-400">
      <h3 className="text-2xl font-light font-cocogoose mb-4 text-center">
        {eventName}
      </h3>

      <div className="flex items-center justify-center gap-2 text-gray-300 mb-3">
        <CalendarMonthIcon />
        <span>{format(eventDate, 'dd.MM.yyyy')}</span>
      </div>

      {hasShift ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <AccessTimeIcon />
            {format(shift.clockIn!, 'HH:mm')} -{' '}
            {format(shift.clockOut!, 'HH:mm')} Uhr
          </div>
          <div className="text-gray-300">
            Gearbeitet:{' '}
            <b>
              {hours}h {minutes.toString().padStart(2, '0')}min
            </b>
          </div>
          {tipAmount != null && (
            <div className="text-green-400">
              Trinkgeld: <b>{tipAmount.toFixed(2)} €</b>
            </div>
          )}
          {shift.changeRequest ? (
            <ChangeRequestMessage
              changeRequest={shift.changeRequest}
              admin={admin}
            />
          ) : (
            <Button
              variant="outlined"
              color="info"
              fullWidth
              onClick={handleClickChangeRequest}
            >
              Arbeitszeiten korrigieren
            </Button>
          )}
          <ChangeTimesDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onCreate={onChangeRequest}
            date={eventDate}
            shift={shift}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-yellow-400 mt-2">
          <InfoIcon />
          Keine Schicht eingetragen
        </div>
      )}
    </div>
  );
}

type ChangeTimesDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: ApiPostShiftChangeRequestResponse) => void;
  date: Date;
  shift: ProfileEventCardProps['shift'];
};

function ChangeTimesDialog({
  open,
  onClose,
  onCreate,
  date,
  shift,
}: ChangeTimesDialogProps) {
  if (!(shift?.clockIn && shift?.clockOut)) return null;
  const eventDate = new Date(date).toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);

  const [startTime, setStartTime] = useState(
    new Date(shift.clockIn).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
  const [startTimeDT, setStartTimeDT] = useState(
    new Date(shift.clockIn).toISOString()
  );
  const [endTime, setEndTime] = useState(
    new Date(shift.clockOut).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
  const [endTimeDT, setEndTimeDT] = useState(
    new Date(shift.clockOut).toISOString()
  );

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post<ApiPostShiftChangeRequestResponse>(
        `/api/shifts/${shift.id}/changeRequest`,
        { clockIn: startTimeDT, clockOut: endTimeDT }
      );
      onCreate(data);
      showSuccess('Anfrage gesendet');
      handleClose();
    } catch (error) {
      showError('Änderung der Zeiten fehlgeschlagen');
    } finally {
      setLoading(false);
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
        Arbeitszeiten korrigieren
      </DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-3">
          <TimeRangePicker
            date={eventDate}
            startTime={startTime}
            endTime={endTime}
            onChange={(newStartTime, newEndTime, start, end) => {
              setStartTime(newStartTime);
              setEndTime(newEndTime);
              setStartTimeDT(`${start}`);
              setEndTimeDT(`${end}`);
            }}
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

function ChangeRequestMessage({
  changeRequest,
  admin,
}: {
  changeRequest: ShiftChangeRequest;
  admin?: boolean;
}) {
  const router = useRouter();
  const [loadingApproveChange, setLoadingApproveChange] = useState(false);
  const [loadingRejectChange, setLoadingRejectChange] = useState(false);

  const approveChange = async () => {
    if (!changeRequest) return;
    try {
      setLoadingApproveChange(true);
      await axios.post(`/api/shiftChangeRequest/${changeRequest.id}/approve`);
      showSuccess('Anfrage angenommen');
      router.reload();
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingApproveChange(false);
    }
  };

  const rejectChange = async () => {
    if (!changeRequest) return;
    try {
      setLoadingRejectChange(true);
      await axios.post(`/api/shiftChangeRequest/${changeRequest.id}/reject`);
      showSuccess('Anfrage abgelehnt');
      router.reload();
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingRejectChange(false);
    }
  };

  if (changeRequest.status == 'PENDING') {
    return admin ? (
      <div className="rounded-md px-3 py-1 bg-gray-700 flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <InfoOutline />
          <p>Die Anfrage zur Korrektur der Zeiten steht noch aus.</p>
        </div>
        <div className="flex items-center justify-evenly gap-3">
          <Tooltip title="Korrektur akzeptieren">
            <IconButton
              color="success"
              disabled={loadingRejectChange}
              loading={loadingApproveChange}
              onClick={approveChange}
            >
              <Check className="text-5xl! sm:text-3xl!" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Korrektur ablehnen">
            <IconButton
              color="error"
              disabled={loadingApproveChange}
              loading={loadingRejectChange}
              onClick={rejectChange}
            >
              <Close className="text-5xl! sm:text-3xl!" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    ) : (
      <div className="rounded-md p-3 bg-gray-700 flex gap-3 items-center">
        <InfoOutline />
        <p>Deine Anfrage zur Korrektur der Zeiten steht noch aus.</p>
      </div>
    );
  } else if (changeRequest.status == 'APPROVED') {
    return (
      <div className="rounded-md p-3 bg-green-800/50 flex gap-3 items-center">
        <CheckCircleOutlineIcon />
        <p>
          {admin ? 'Die' : 'Deine'} Anfrage zur Korrektur der Zeiten wurde
          angenommen.
        </p>
      </div>
    );
  } else {
    return (
      <div className="rounded-md p-3 bg-red-800/50 flex gap-3 items-center">
        <HighlightOffIcon />
        <p>
          {admin ? 'Die' : 'Deine'} Anfrage zur Korrektur der Zeiten wurde
          abgelehnt.
        </p>
      </div>
    );
  }
}
