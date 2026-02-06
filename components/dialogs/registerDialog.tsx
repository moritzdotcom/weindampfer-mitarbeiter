import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Button,
  DialogActions,
} from '@mui/material';
import DialogTransition from '../dialogs/transition';
import axios from 'axios';
import { showError, showSuccess } from '@/lib/toast';
import { ApiPostRegistrationResponse } from '@/pages/api/registrations';

type RegisterDialogProps = {
  open: boolean;
  onClose: () => void;
  event: { id: string; setupRequired: boolean; teardownRequired: boolean };
  onRegister: (registration: ApiPostRegistrationResponse) => void;
};

export default function RegisterDialog({
  open,
  onClose,
  event,
  onRegister,
}: RegisterDialogProps) {
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
        },
      );
      showSuccess('Erfolgreich für das Event eingetragen');
      onRegister(data);
    } catch (error) {
      console.error('Error registering for event:', error);
      showError('Fehler beim Eintragen für das Event');
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setHelpsSetup(false);
    setHelpsTeardown(false);
    onClose();
  };

  return (
    <Dialog
      slots={{ transition: DialogTransition }}
      open={open}
      onClose={handleClose}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: 'var(--color-neutral-800)',
          },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Für Event eintragen
      </DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-4 mt-2 mb-4">
          {event.setupRequired && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpsSetup}
                  onChange={(e) => setHelpsSetup(e.target.checked)}
                />
              }
              label="Ich helfe beim Aufbau"
            />
          )}
          {event.teardownRequired && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpsTeardown}
                  onChange={(e) => setHelpsTeardown(e.target.checked)}
                />
              }
              label="Ich helfe beim Abbau"
            />
          )}
        </div>
        <DialogActions
          sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}
        >
          <Button fullWidth onClick={handleClose}>
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
  );
}
