import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import DialogTransition from './transition';
import axios from 'axios';
import TimeRangePicker from '../timeRangePicker';
import { format } from 'date-fns';
import { showSuccess } from '@/lib/toast';
import { ApiPutShiftResponse } from '@/pages/api/shifts/[shiftId]/edit';

type EditShiftDialogProps = {
  open: boolean;
  userName: string;
  eventDate: Date;
  shift: { id: string; clockIn: Date | null; clockOut: Date | null };
  onClose: () => void;
  onUpdate: (shift: ApiPutShiftResponse) => void;
};

export default function EditShiftDialog({
  open,
  userName,
  eventDate,
  shift,
  onClose,
  onUpdate,
}: EditShiftDialogProps) {
  const [clockIn, setClockIn] = useState(
    shift.clockIn ? format(shift.clockIn, 'HH:mm') : ''
  );
  const [clockInDT, setClockInDT] = useState(
    shift.clockIn ? format(shift.clockIn, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [clockOut, setClockOut] = useState(
    shift.clockOut ? format(shift.clockOut, 'HH:mm') : ''
  );
  const [clockOutDT, setClockOutDT] = useState(
    shift.clockOut ? format(shift.clockOut, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [loading, setLoading] = useState(false);

  console.log({ clockIn, clockInDT, clockOut, clockOutDT });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put<ApiPutShiftResponse>(
        `/api/shifts/${shift.id}/edit`,
        { clockIn: new Date(clockInDT), clockOut: new Date(clockOutDT) }
      );
      showSuccess('Zeiten gespeichert');
      onUpdate(data);
      handleClose();
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slots={{ transition: DialogTransition }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 2,
          },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Zeiten bearbeiten
      </DialogTitle>
      <DialogContent>
        <p className="text-lg my-3">
          Von wann bis wann hat <b>{userName}</b> am{' '}
          <b>{format(eventDate, 'dd.MM.yyyy')}</b> gearbeitet?
        </p>
        <TimeRangePicker
          date={format(eventDate, 'yyyy-MM-dd')}
          startTime={clockIn}
          endTime={clockOut}
          onChange={(newStartTime, newEndTime, start, end) => {
            setClockIn(newStartTime);
            setClockOut(newEndTime);
            setClockInDT(`${start}`);
            setClockOutDT(`${end}`);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button fullWidth onClick={handleClose} color="inherit">
          Abbrechen
        </Button>
        <Button
          fullWidth
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          Zeiten speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
