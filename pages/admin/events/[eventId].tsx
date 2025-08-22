import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  AccessTime,
  CalendarMonth,
  Check,
  Close,
  InfoOutlined,
} from '@mui/icons-material';
import { formatEventDate, formatEventTime } from '@/lib/event';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Session } from '@/hooks/useSession';
import { GetServerSidePropsContext } from 'next';
import BackendBackButton from '@/components/backendBackButton';
import { ApiGetEventAdminResponse } from '@/pages/api/events/[eventId]/admin';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  calculatePersonalTip,
  formatShiftTime,
  isSameMinute,
} from '@/lib/shift';
import { showError } from '@/lib/toast';
import { ApiShiftToggleTipResponse } from '@/pages/api/shifts/[shiftId]/toggleTip';
import { ApiApproveShiftChangeRequestResponse } from '@/pages/api/shiftChangeRequest/[id]/approve';
import CreateShiftDialog from '@/components/dialogs/createShiftDialog';
import { ApiPostShiftResponse } from '@/pages/api/shifts';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreateRegistrationDialog from '@/components/dialogs/createRegistrationDialog';
import { ApiCreateRegistrationForUserResponse } from '@/pages/api/users/[userId]/createRegistration';

export default function AdminEventPage({
  session,
  eventId,
}: {
  session: Session;
  eventId: string;
}) {
  useAuthGuard(session);
  const [event, setEvent] = useState<ApiGetEventAdminResponse>();
  const [totalTip, setTotalTip] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [createRegistrationOpen, setCreateRegistrationOpen] = useState(false);

  const onApproveChange = (
    id: string,
    shift: ApiApproveShiftChangeRequestResponse
  ) => {
    setEvent((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        registrations: prev.registrations.map((r) => {
          if (r.shift?.changeRequest?.id !== id) return r;
          return { ...r, shift };
        }),
      };
    });
  };

  const onShiftCreated = (id: string, shift: ApiPostShiftResponse) => {
    setEvent((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        registrations: prev.registrations.map((r) => {
          if (r.id !== id) return r;
          return { ...r, shift: { ...shift, changeRequest: null } };
        }),
      };
    });
  };

  const onRegistrationCreated = (
    registration: ApiCreateRegistrationForUserResponse
  ) => {
    setEvent((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        registrations: [
          ...prev.registrations,
          {
            ...registration,
            shift: registration.shift
              ? { ...registration.shift, changeRequest: null }
              : null,
          },
        ],
      };
    });
  };

  const onRejectChange = (id: string) => {
    setEvent((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        registrations: prev.registrations.map((r) => {
          if (r.shift?.changeRequest?.id !== id) return r;
          return { ...r, shift: { ...r.shift, changeRequest: null } };
        }),
      };
    });
  };

  const onToggleTip = (id: string, receivesTip: boolean) => {
    setEvent((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        registrations: prev.registrations.map((r) => {
          if (r.shift?.id !== id) return r;
          return { ...r, shift: { ...r.shift, receivesTip } };
        }),
      };
    });
  };

  const handleSaveTip = async () => {
    try {
      setLoading(true);
      await axios.put(`/api/events/${eventId}/admin`, {
        totalTip: Number(totalTip),
      });
      setEvent((prev) =>
        prev ? { ...prev, totalTip: Number(totalTip) } : undefined
      );
    } catch (error) {
      showError('Speichern fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const { data } = await axios.get<ApiGetEventAdminResponse>(
        `/api/events/${eventId}/admin`
      );
      setEvent(data);
      setTotalTip(`${data.totalTip || ''}`);
    }
    fetchData();
  }, []);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-8">
      <div>
        <BackendBackButton href="/admin/events" />
        <h2 className="text-3xl sm:text-5xl text-center font-light font-cocogoose">
          {event?.name}
        </h2>
      </div>
      {event ? (
        <div>
          <div className="flex items-center gap-4 text-gray-300 justify-center mt-7">
            <CalendarMonth />
            <span className="mr-5">{formatEventDate(event.startTime)}</span>
            <AccessTime />
            <span>
              {formatEventTime(event.startTime)} -{' '}
              {formatEventTime(event.endTime)}
            </span>
          </div>

          <Divider sx={{ my: 2 }}>Trinkgeld</Divider>
          <TextField
            fullWidth
            type="number"
            label="Trinkgeld in €"
            value={totalTip}
            onChange={(e) => setTotalTip(e.target.value)}
            slotProps={{
              input: { sx: { bgcolor: 'var(--color-neutral-900)' } },
            }}
          />
          <Button
            color="secondary"
            variant="contained"
            fullWidth
            onClick={handleSaveTip}
            loading={loading}
            disabled={Number(event.totalTip) == Number(totalTip)}
            sx={{ mt: 2 }}
          >
            Speichern
          </Button>

          <Divider sx={{ my: 2 }}>Registrierungen</Divider>
          <div className="flex flex-col gap-4">
            {event.registrations.map((reg) => {
              return (
                <EventRegistrationCard
                  key={reg.id}
                  registration={reg}
                  eventDate={event.date}
                  tipReceived={calculatePersonalTip(
                    Number(totalTip || 0),
                    reg.shift,
                    event.registrations.map(({ shift }) => shift)
                  )}
                  onApproveChange={onApproveChange}
                  onRejectChange={onRejectChange}
                  onToggleTip={onToggleTip}
                  onShiftCreated={(s) => onShiftCreated(reg.id, s)}
                />
              );
            })}
          </div>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PersonAddIcon />}
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'black',
              borderRadius: '10px',
              mt: 2,
            }}
            onClick={() => setCreateRegistrationOpen(true)}
          >
            Registrierung hinzufügen
          </Button>
          <CreateRegistrationDialog
            open={createRegistrationOpen}
            onClose={() => setCreateRegistrationOpen(false)}
            event={event}
            disabledUserIds={event.registrations.map((r) => r.userId)}
            onCreate={onRegistrationCreated}
          />
        </div>
      ) : (
        <div className="w-full flex justify-center mt-10">
          <CircularProgress color="inherit" size={40} />
        </div>
      )}
    </Box>
  );
}

function EventRegistrationCard({
  registration,
  eventDate,
  tipReceived,
  onApproveChange,
  onRejectChange,
  onToggleTip,
  onShiftCreated,
}: {
  registration: ApiGetEventAdminResponse['registrations'][number];
  eventDate: Date;
  tipReceived: number | null;
  onApproveChange: (
    id: string,
    shift: ApiApproveShiftChangeRequestResponse
  ) => void;
  onRejectChange: (id: string) => void;
  onToggleTip: (id: string, receivesTip: boolean) => void;
  onShiftCreated: (shift: ApiPostShiftResponse) => void;
}) {
  const user = registration.user;
  const shift = registration.shift;
  const changeRequest = shift?.changeRequest;
  const [loadingApproveChange, setLoadingApproveChange] = useState(false);
  const [loadingRejectChange, setLoadingRejectChange] = useState(false);
  const [loadingToggleTip, setLoadingToggleTip] = useState(false);
  const [createShiftOpen, setCreateShiftOpen] = useState(false);

  const approveChange = async () => {
    if (!changeRequest) return;
    try {
      setLoadingApproveChange(true);
      const { data } = await axios.post<ApiApproveShiftChangeRequestResponse>(
        `/api/shiftChangeRequest/${changeRequest.id}/approve`
      );
      onApproveChange(changeRequest.id, data);
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
      onRejectChange(changeRequest.id);
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingRejectChange(false);
    }
  };

  const toggleTip = async (checked: boolean) => {
    if (!shift) return;
    try {
      setLoadingToggleTip(true);
      const { data } = await axios.put<ApiShiftToggleTipResponse>(
        `/api/shifts/${shift.id}/toggleTip`,
        { receivesTip: checked }
      );
      onToggleTip(data.id, data.receivesTip);
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingToggleTip(false);
    }
  };

  return (
    <div className="bg-neutral-800 p-4 rounded-xl shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Avatar
              src={user.image || undefined}
              alt={user.name}
              sx={{ width: 56, height: 56 }}
            >
              {user.name?.[0]?.toUpperCase() || '👤'}
            </Avatar>
            <div>
              <p className="font-medium text-lg text-white">{user.name}</p>
              <div className="text-sm text-gray-100 flex gap-2">
                {registration.helpsSetup && (
                  <span className="bg-green-800/50 px-2 rounded-xl mt-1">
                    Aufbau
                  </span>
                )}
                {registration.helpsTeardown && (
                  <span className="bg-blue-800/50 px-2 rounded-xl mt-1">
                    Abbau
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {shift ? (
          <div className="flex flex-col gap-2 text-sm text-gray-200 mt-3 sm:mt-0">
            <p>
              <b>Check-in:</b> {formatShiftTime(shift.clockIn)}
            </p>
            <p>
              <b>Check-out:</b> {formatShiftTime(shift.clockOut)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mt-3 sm:mt-0">
            <p className="text-sm text-gray-400">Noch kein Check-in</p>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreateShiftOpen(true)}
            >
              Zeiten manuell eintragen
            </Button>
            <CreateShiftDialog
              open={createShiftOpen}
              onClose={() => setCreateShiftOpen(false)}
              onCreate={onShiftCreated}
              eventDate={eventDate}
              registrationId={registration.id}
              userName={user.name}
            />
          </div>
        )}
      </div>
      {shift && (
        <div className="mt-3 flex flex-col sm:flex-row justify-between sm:items-center">
          <div className="flex items-center -ml-3">
            <div className="w-11 h-11 flex items-center justify-center">
              {loadingToggleTip ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <Checkbox
                  size="small"
                  checked={shift.receivesTip}
                  onChange={(e) => toggleTip(e.target.checked)}
                  sx={{ color: 'white' }}
                />
              )}
            </div>
            <span className="text-white">Bekommt Trinkgeld</span>
          </div>
          {tipReceived ? (
            <span>
              Trinkgeld: <b>{tipReceived.toFixed(2)} €</b>
            </span>
          ) : (
            <span className="text-gray-400">Kein Trinkgeld</span>
          )}
        </div>
      )}
      {changeRequest && (
        <div className="mt-2 rounded-lg px-4 py-2 text-yellow-400 border border-yellow-400">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <InfoOutlined fontSize="small" />
              <span>Korrektur-Anfrage</span>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip title="Korrektur akzeptieren">
                <IconButton
                  color="success"
                  disabled={loadingRejectChange}
                  loading={loadingApproveChange}
                  size="medium"
                  onClick={approveChange}
                >
                  <Check fontSize="medium" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Korrektur ablehnen">
                <IconButton
                  color="error"
                  disabled={loadingApproveChange}
                  loading={loadingRejectChange}
                  size="medium"
                  onClick={rejectChange}
                >
                  <Close fontSize="medium" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-3 text-gray-100">
            {!isSameMinute(shift.clockIn, changeRequest.clockIn) && (
              <p>
                <b>Check-in:</b> {formatShiftTime(shift.clockIn)}
                {' -> '}
                {formatShiftTime(changeRequest.clockIn)}
              </p>
            )}
            {!isSameMinute(shift.clockOut, changeRequest.clockOut) && (
              <p>
                <b>Check-out:</b> {formatShiftTime(shift.clockOut)}
                {' -> '}
                {formatShiftTime(changeRequest.clockOut)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { eventId } = context.query;
  if (!eventId) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: { eventId } };
}
