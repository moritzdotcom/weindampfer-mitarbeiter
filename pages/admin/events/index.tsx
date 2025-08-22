import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Skeleton,
  InputAdornment,
  DialogActions,
  Button,
} from '@mui/material';
import axios from 'axios';
import { Session } from '@/hooks/useSession';
import { formatEventDate, formatEventTime } from '@/lib/event';
import { Edit } from '@mui/icons-material';
import BackendBackButton from '@/components/backendBackButton';
import { ApiGetEventsResponse } from '../../api/events';
import { ApiPutEventAdminResponse } from '../../api/events/[eventId]/admin';
import { showError, showSuccess } from '@/lib/toast';
import AddIcon from '@mui/icons-material/Add';
import DialogTransition from '@/components/dialogs/transition';
import DateTimeRangePicker from '@/components/dateTimeRangePicker';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import useCopy from '@/hooks/useCopy';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function AdminEventsPage({ session }: { session: Session }) {
  useAuthGuard(session, 'ADMIN');
  const [events, setEvents] = useState<ApiGetEventsResponse>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const res = await axios.get<ApiGetEventsResponse>('/api/events');
    const sorted = res.data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setLoading(false);
    setEvents(sorted);
  };

  const updateEvents = (event: ApiPutEventAdminResponse) => {
    setEvents((prev) =>
      prev.map((e) => (e.id == event.id ? { ...e, ...event } : e))
    );
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, []);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-8">
      <div>
        <BackendBackButton />
        <h2 className="text-2xl text-center font-light font-cocogoose">
          Veranstaltungen verwalten
        </h2>
      </div>
      <button
        className="w-full bg-white rounded text-black font-bold px-3 py-3 my-5 hover:bg-gray-200 transition-colors flex items-center gap-2 justify-center"
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
        Veranstaltung erstellen
      </button>

      {loading && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      )}
      <Grid container spacing={4}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} onUpdate={updateEvents} />
        ))}
      </Grid>

      <NewEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchEvents}
      />
    </Box>
  );
}

function EventCard({
  event,
  onUpdate,
}: {
  event: ApiGetEventsResponse[number];
  onUpdate: (event: ApiPutEventAdminResponse) => void;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { copied, handleCopy } = useCopy();

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box className="rounded-2xl bg-gray-100 border border-gray-200 p-6">
        <div className="mb-2">
          <h6 className="text-xl font-semibold text-gray-900">{event.name}</h6>
        </div>
        <p className="text-sm text-gray-700 mb-2">
          Datum: {formatEventDate(event.date)}
        </p>
        <p className="text-sm text-gray-700 mb-2">
          {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
        </p>
        <p className="text-sm text-gray-700 mb-2">
          {event._count.registrations}/{event.peopleRequired} Personen
          eingetragen
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <Button
            variant="contained"
            color="secondary"
            href={`/admin/events/${event.id}`}
          >
            Zum Event
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setEditDialogOpen(true)}
            startIcon={<Edit />}
          >
            <p>Bearbeiten</p>
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() =>
              handleCopy({
                link: `${window?.location?.origin}/events/${event.id}`,
                title: `Jetzt für ${event.name} anmelden`,
              })
            }
            startIcon={copied ? <DoneAllIcon /> : <ContentCopyIcon />}
          >
            <p>Link teilen</p>
          </Button>
        </div>
      </Box>
      <EditEventDialog
        event={event}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onUpdate={(updatedEvent) => {
          onUpdate(updatedEvent);
          setEditDialogOpen(false);
        }}
      />
    </Grid>
  );
}

function NewEventDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [startTimeDT, setStartTimeDT] = useState('');
  const [endTime, setEndTime] = useState('');
  const [endTimeDT, setEndTimeDT] = useState('');
  const [peopleRequired, setPeopleRequired] = useState('8');

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);

    try {
      await axios.post('/api/events', {
        name,
        date,
        startTime: startTimeDT,
        endTime: endTimeDT,
        peopleRequired: Number(peopleRequired),
      });
      setName('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setPeopleRequired('8');
      showSuccess('Veranstaltung erfolgreich erstellt');
      onSuccess();
      onClose();
    } catch (error) {
      showError('Fehler beim Erstellen der Veranstaltung');
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      slots={{ transition: DialogTransition }}
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Neue Veranstaltung erstellen
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Veranstaltungsname"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <DateTimeRangePicker
          date={date}
          startTime={startTime}
          endTime={endTime}
          onChange={(newDate, newStartTime, newEndTime, start, end) => {
            setDate(newDate);
            setStartTime(newStartTime);
            setEndTime(newEndTime);
            setStartTimeDT(`${start}`);
            setEndTimeDT(`${end}`);
          }}
        />
        <TextField
          label="Mitarbeiter benötigt"
          type="number"
          fullWidth
          value={peopleRequired}
          onChange={(e) => setPeopleRequired(e.target.value)}
          margin="normal"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">Personen</InputAdornment>
              ),
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button fullWidth onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          fullWidth
          color="secondary"
          variant="contained"
          onClick={handleCreate}
          loading={loading}
          disabled={!name.trim() || !date || !startTime || !endTime}
        >
          Erstellen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditEventDialog({
  event,
  open,
  onClose,
  onUpdate,
}: {
  event: ApiGetEventsResponse[number];
  open: boolean;
  onClose: () => void;
  onUpdate: (event: ApiPutEventAdminResponse) => void;
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(
    new Date(event.date).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    new Date(event.startTime).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
  const [startTimeDT, setStartTimeDT] = useState(
    new Date(event.startTime).toISOString()
  );
  const [endTime, setEndTime] = useState(
    new Date(event.endTime).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
  const [endTimeDT, setEndTimeDT] = useState(
    new Date(event.endTime).toISOString()
  );
  const [peopleRequired, setPeopleRequired] = useState(
    event.peopleRequired.toString()
  );
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);

    try {
      const { data } = await axios.put<ApiPutEventAdminResponse>(
        `/api/events/${event.id}/admin`,
        {
          name,
          date,
          startTime: startTimeDT,
          endTime: endTimeDT,
          peopleRequired: Number(peopleRequired),
        }
      );
      showSuccess('Veranstaltung erfolgreich aktualisiert');
      onUpdate(data);
      onClose();
    } catch (error) {
      showError('Fehler beim Aktualisieren der Veranstaltung');
      console.error('Error updating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Event bearbeiten
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Veranstaltungsname"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <DateTimeRangePicker
          date={date}
          startTime={startTime}
          endTime={endTime}
          onChange={(newDate, newStartTime, newEndTime, start, end) => {
            setDate(newDate);
            setStartTime(newStartTime);
            setEndTime(newEndTime);
            setStartTimeDT(`${start}`);
            setEndTimeDT(`${end}`);
          }}
        />
        <TextField
          label="Mitarbeiter benötigt"
          type="number"
          fullWidth
          value={peopleRequired}
          onChange={(e) => setPeopleRequired(e.target.value)}
          margin="normal"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">Personen</InputAdornment>
              ),
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button fullWidth onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          fullWidth
          color="secondary"
          variant="contained"
          disabled={!name.trim() || !date || !startTime || !endTime}
          onClick={handleUpdate}
          loading={loading}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
