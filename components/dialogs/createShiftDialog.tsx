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
import { ApiPostShiftResponse } from '@/pages/api/registrations/[registrationId]/createShift';
import TimeRangePicker from '../timeRangePicker';
import { format } from 'date-fns';
import { showSuccess } from '@/lib/toast';

type CreateShiftDialogProps = {
  open: boolean;
  registrationId: string;
  userName: string;
  eventDate: Date;
  onClose: () => void;
  onCreate: (shift: ApiPostShiftResponse) => void;
};

export default function CreateShiftDialog({
  open,
  registrationId,
  userName,
  eventDate,
  onClose,
  onCreate,
}: CreateShiftDialogProps) {
  const [clockIn, setClockIn] = useState('');
  const [clockInDT, setClockInDT] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [clockOutDT, setClockOutDT] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post<ApiPostShiftResponse>(
        `/api/registrations/${registrationId}/createShift`,
        { clockIn: new Date(clockInDT), clockOut: new Date(clockOutDT) }
      );
      showSuccess('Zeiten gespeichert');
      onCreate(data);
      handleClose();
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClockIn('');
    setClockInDT('');
    setClockOut('');
    setClockOutDT('');
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
        Zeiten manuell erfassen
      </DialogTitle>
      <DialogContent>
        <p className="text-lg my-3">
          Von wann bis wann hat <b>{userName}</b> am{' '}
          <b>{format(eventDate, 'dd.MM.yyyy')}</b> gearbeitet?
        </p>
        <TimeRangePicker
          date={new Date(eventDate).toISOString().split('T')[0]}
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
          Registrierung speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
