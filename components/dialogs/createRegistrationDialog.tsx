import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
} from '@mui/material';
import { useEffect, useState } from 'react';
import DialogTransition from './transition';
import axios from 'axios';
import TimeRangePicker from '../timeRangePicker';
import { ApiCreateRegistrationForUserResponse } from '@/pages/api/users/[userId]/createRegistration';
import { ApiGetUsersResponse } from '@/pages/api/users';
import { showError, showSuccess } from '@/lib/toast';

type CreateRegistrationDialogProps = {
  open: boolean;
  event: { id: string; name: string; date: Date };
  disabledUserIds: string[];
  onClose: () => void;
  onCreate: (shift: ApiCreateRegistrationForUserResponse) => void;
};

export default function CreateRegistrationDialog({
  open,
  event,
  disabledUserIds,
  onClose,
  onCreate,
}: CreateRegistrationDialogProps) {
  const [users, setUsers] = useState<ApiGetUsersResponse>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [helpsSetup, setHelpsSetup] = useState(false);
  const [helpsTeardown, setHelpsTeardown] = useState(false);
  const [clockIn, setClockIn] = useState('');
  const [clockInDT, setClockInDT] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [clockOutDT, setClockOutDT] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const { data } = await axios.post<ApiCreateRegistrationForUserResponse>(
        `/api/users/${selectedUserId}/createRegistration`,
        {
          eventId: event.id,
          helpsSetup,
          helpsTeardown,
          clockIn: new Date(clockInDT),
          clockOut: new Date(clockOutDT),
        }
      );
      onCreate(data);
      showSuccess('Registrierung hinzugefügt');
      handleClose();
    } catch (error) {
      console.error('Error creating invite:', error);
      showError('Fehler beim hinzufügen');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId(undefined);
    setClockIn('');
    setClockInDT('');
    setClockOut('');
    setClockOutDT('');
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      const { data } = await axios.get<ApiGetUsersResponse>('/api/users');
      setUsers(data);
      setLoadingUsers(false);
    }
    if (open) fetchUsers();
  }, [open]);

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={handleClose}
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
        Registreirung hinzufügen
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel
            id="user-select-label"
            sx={{
              color: 'white',
              '&.Mui-focused': {
                color: 'white',
              },
            }}
          >
            Benutzer wählen
          </InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value)}
            label="Benutzer wählen"
            renderValue={(selected) => {
              const user = users.find((u) => u.id === selected);
              if (!user) return '';
              return (
                <div className="flex items-center gap-2">
                  <Avatar
                    src={user.image || undefined}
                    sx={{ width: 24, height: 24 }}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <span>{user.name}</span>
                </div>
              );
            }}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
          >
            {users
              .filter(({ id }) => !disabledUserIds.includes(id))
              .map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <ListItemIcon sx={{ minWidth: 36, mr: 2 }}>
                    <Avatar src={user.image || undefined}>
                      {user.name?.[0]?.toUpperCase() || '👤'}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText>{user.name}</ListItemText>
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <div className="flex flex-col gap-4 mt-2 mb-4">
          <FormControlLabel
            control={
              <Checkbox
                checked={helpsSetup}
                onChange={(e) => setHelpsSetup(e.target.checked)}
              />
            }
            label="Hilft beim Aufbau"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={helpsTeardown}
                onChange={(e) => setHelpsTeardown(e.target.checked)}
              />
            }
            label="Hilft beim Abbau"
          />
        </div>
        <p className="text-lg my-3">Arbeitszeiten</p>
        <TimeRangePicker
          date={new Date(event.date).toISOString().split('T')[0]}
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
