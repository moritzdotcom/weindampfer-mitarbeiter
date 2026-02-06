import { ApiPostInvitesResponse } from '@/pages/api/invites';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import DialogTransition from './transition';
import axios from 'axios';
import { showError } from '@/lib/toast';

type NewInviteDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (newInvite: ApiPostInvitesResponse) => void;
};

export default function NewInviteDialog({
  open,
  onClose,
  onCreate,
}: NewInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post<ApiPostInvitesResponse>(
        '/api/invites',
        { email },
      );
      onCreate(data);
      handleClose();
    } catch (error) {
      console.error('Error creating invite:', error);
      showError('Benutzer konnte nicht eingeladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
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
        User einladen
      </DialogTitle>
      <DialogContent>
        <TextField
          label="E-Mail"
          fullWidth
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          Einladen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
