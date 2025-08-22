import { ApiGetInvitesResponse } from '@/pages/api/invites';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useState } from 'react';
import axios from 'axios';
import { ApiPostInviteSendMailResponse } from '@/pages/api/invites/[inviteId]/sendMail';
import { showError, showSuccess } from '@/lib/toast';
import useCopy from '@/hooks/useCopy';

export default function AdminInviteCard({
  invite,
  onDelete,
}: {
  invite: ApiGetInvitesResponse[number];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-neutral-800 text-white rounded-2xl p-4 flex flex-wrap items-center gap-4 justify-between shadow-md">
      <div>
        <h3 className="text-base font-semibold">{invite.email}</h3>
        <p className="text-sm text-neutral-400">
          Eingeladen von {invite.invitedBy} am{' '}
          {new Date(invite.createdAt).toLocaleDateString('de')}
        </p>
      </div>

      {/* Aktionen */}
      <div className="flex gap-2 items-center space-x-2">
        <SendInviteButton id={invite.id} />
        <CopyInviteLinkButton id={invite.id} />
        <DeleteInviteButton id={invite.id} onDelete={onDelete} />
      </div>
    </div>
  );
}

function SendInviteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    setLoading(true);
    try {
      await axios.post<ApiPostInviteSendMailResponse>(
        `/api/invites/${id}/sendMail`
      );
      showSuccess('Einladung wurde erneut gesendet!');
    } catch (error) {
      console.error('Fehler beim Senden der Einladung:', error);
      showError(
        'Fehler beim Senden der Einladung. Bitte versuche es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Tooltip title="Einladung erneut senden">
      <IconButton
        loading={loading}
        onClick={handleSend}
        sx={{ color: 'white' }}
      >
        <SendIcon />
      </IconButton>
    </Tooltip>
  );
}

function CopyInviteLinkButton({ id }: { id: string }) {
  const { copied, handleCopy } = useCopy();

  return (
    <Tooltip title="Einladungslink kopieren">
      <IconButton
        onClick={() =>
          handleCopy({
            link: `${window?.location?.origin}/auth/signup?inviteId=${id}`,
            title: 'Weindampfer Einladungslink',
          })
        }
        sx={{ color: copied ? 'green' : 'white' }}
      >
        {copied ? <DoneAllIcon /> : <ContentCopyIcon />}
      </IconButton>
    </Tooltip>
  );
}

function DeleteInviteButton({
  id,
  onDelete,
}: {
  id: string;
  onDelete: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/invites/${id}`);
      onDelete(id);
      showSuccess('Einladung gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen der Einladung:', error);
      showError(
        'Fehler beim Löschen der Einladung. Bitte versuche es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Einladung löschen">
      <IconButton
        loading={loading}
        onClick={handleDelete}
        sx={{ color: 'red', '&:hover': { backgroundColor: '#7f1d1d' } }}
      >
        <DeleteOutlineIcon />
      </IconButton>
    </Tooltip>
  );
}
