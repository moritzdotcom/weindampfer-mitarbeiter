import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import { Session } from '@/hooks/useSession';
import BackendBackButton from '@/components/backendBackButton';
import { showError, showSuccess } from '@/lib/toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { ApiGetEmployeeRequestsResponse } from '../api/employeeRequests';
import { formatShiftTime, isSameMinute } from '@/lib/shift';
import { Check, Close } from '@mui/icons-material';
import { fullEventName } from '@/lib/event';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LocationMap = dynamic(() => import('../../components/locationMap'), {
  ssr: false,
});

export default function AdminRequestsPage({ session }: { session: Session }) {
  useAuthGuard(session, 'ADMIN');
  const [requests, setRequests] = useState<ApiGetEmployeeRequestsResponse>();

  const registrationRequests = requests?.registrations;
  const shiftRequests = requests?.shifts;

  const handleRemoveRegistrationRequest = (id: string) => {
    setRequests((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        registrations: prev.registrations.filter((cq) => cq.id !== id),
      };
    });
  };

  const handleRemoveChangeRequest = (id: string) => {
    setRequests((prev) => {
      if (!prev) return undefined;
      return { ...prev, shifts: prev.shifts.filter((cq) => cq.id !== id) };
    });
  };

  const fetchRequests = async () => {
    const { data } = await axios.get<ApiGetEmployeeRequestsResponse>(
      '/api/employeeRequests'
    );
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-8">
      <div>
        <BackendBackButton />
        <h2 className="text-2xl text-center font-light font-cocogoose">
          Mitarbeiter Anfragen
        </h2>
      </div>

      {requests ? (
        <div>
          {registrationRequests && (
            <div className="flex flex-col gap-6 mt-6">
              <Divider>Austragungen</Divider>
              {registrationRequests.map((registration) => {
                return (
                  <RegistrationRequestCard
                    key={registration.id}
                    registration={registration}
                    onAction={handleRemoveRegistrationRequest}
                  />
                );
              })}
            </div>
          )}
          {shiftRequests && (
            <div className="flex flex-col gap-6 mt-6">
              <Divider>Zeiterfassungs-Korrekturen</Divider>
              {shiftRequests.map((changeRequest) => {
                return (
                  <ChangeRequestCard
                    key={changeRequest.id}
                    changeRequest={changeRequest}
                    onAction={handleRemoveChangeRequest}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex justify-center mt-10">
          <CircularProgress color="inherit" size={40} />
        </div>
      )}
    </Box>
  );
}

function RegistrationRequestCard({
  registration,
  onAction,
}: {
  registration: ApiGetEmployeeRequestsResponse['registrations'][number];
  onAction: (id: string) => void;
}) {
  const [loadingApproveChange, setLoadingApproveChange] = useState(false);
  const [loadingRejectChange, setLoadingRejectChange] = useState(false);

  const approveChange = async () => {
    if (!registration) return;
    try {
      setLoadingApproveChange(true);
      await axios.post(`/api/registrations/${registration.id}/approveCancel`);
      showSuccess('Anfrage angenommen');
      onAction(registration.id);
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingApproveChange(false);
    }
  };

  const rejectChange = async () => {
    if (!registration) return;
    try {
      setLoadingRejectChange(true);
      await axios.post(`/api/registrations/${registration.id}/rejectCancel`);
      showSuccess('Anfrage abgelehnt');
      onAction(registration.id);
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingRejectChange(false);
    }
  };

  return (
    <div className="rounded-xl p-2 text-white bg-neutral-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col gap-2 p-3">
          <Link
            href={`/profile/${registration.user.id}`}
            className="font-semibold text-xl"
          >
            {registration.user.name}
          </Link>
          <p className="text-gray-300">{fullEventName(registration.event)}</p>
          <p className="text-gray-300 italic">{registration.cancelReason}</p>
        </div>
        <div className="flex items-center justify-evenly gap-3">
          <Tooltip title="Absage akzeptieren">
            <IconButton
              color="success"
              disabled={loadingRejectChange}
              loading={loadingApproveChange}
              onClick={approveChange}
            >
              <Check className="text-5xl! sm:text-3xl!" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Absage ablehnen">
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
    </div>
  );
}

function ChangeRequestCard({
  changeRequest,
  onAction,
}: {
  changeRequest: ApiGetEmployeeRequestsResponse['shifts'][number];
  onAction: (id: string) => void;
}) {
  const shift = changeRequest.shift;
  const [loadingApproveChange, setLoadingApproveChange] = useState(false);
  const [loadingRejectChange, setLoadingRejectChange] = useState(false);

  const approveChange = async () => {
    if (!changeRequest) return;
    try {
      setLoadingApproveChange(true);
      await axios.post(`/api/shiftChangeRequest/${changeRequest.id}/approve`);
      showSuccess('Anfrage angenommen');
      onAction(changeRequest.id);
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
      onAction(changeRequest.id);
    } catch (error) {
      showError('Aktualisierung fehlgeschlagen');
    } finally {
      setLoadingRejectChange(false);
    }
  };

  return (
    <div className="rounded-xl p-2 text-white bg-neutral-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col gap-2 p-3">
          <Link
            href={`/profile/${shift.registration.user.id}`}
            className="font-semibold text-xl"
          >
            {shift.registration.user.name}
          </Link>
          <p className="text-gray-300 mb-2">
            {fullEventName(shift.registration.event)}
          </p>
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
      {shift.clockInLat && shift.clockInLon && (
        <div className="p-2">
          <LocationMap shift={shift} />
        </div>
      )}
    </div>
  );
}
