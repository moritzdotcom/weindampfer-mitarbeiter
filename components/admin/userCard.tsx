import { Avatar, IconButton } from '@mui/material';
import { useState } from 'react';
import { ApiGetUsersResponse } from '@/pages/api/users';
import { ConfirmDialog } from '../dialogs/confirmDialog';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import DialogTransition from '../dialogs/transition';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import axios from 'axios';
import { showError, showSuccess } from '@/lib/toast';
import { ApiUserPutResponse } from '@/pages/api/users/[userId]';
import { useImageUpload } from '@/hooks/useImageUpload';

export default function AdminUserCard({
  user,
  onUpdate,
  onDeactivate,
}: {
  user: ApiGetUsersResponse[number];
  onUpdate: (updated: ApiUserPutResponse) => void;
  onDeactivate: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  return (
    <div
      className={`bg-neutral-800 text-white rounded-2xl p-4 flex flex-wrap items-center gap-4 justify-between shadow-md border ${
        user.role === 'ADMIN' ? 'border-yellow-500' : 'border-neutral-700'
      }`}
    >
      {/* User Info */}
      <div className="flex items-center space-x-4">
        {/* MUI Avatar mit Bild oder Initialen */}
        <Avatar
          src={user.image || undefined}
          alt={user.name}
          sx={{
            width: 48,
            height: 48,
            fontSize: 20,
            bgcolor: '#333',
            color: '#fff',
          }}
        >
          {user.name?.[0]?.toUpperCase() || '👤'}
        </Avatar>

        <div>
          <h3 className="text-base font-semibold">
            {user.role === 'ADMIN' && '👑 '}
            {user.name}
          </h3>
          <p className="text-sm text-neutral-400">{user.email}</p>
        </div>
      </div>

      {/* Aktionen */}
      {user.role !== 'ADMIN' && (
        <div className="flex gap-2 items-center space-x-2">
          <IconButton onClick={() => setEditOpen(true)} sx={{ color: 'white' }}>
            <EditIcon />
          </IconButton>
          <IconButton href={`/profile/${user.id}`} sx={{ color: 'white' }}>
            <PersonSearchIcon />
          </IconButton>
          <IconButton
            onClick={() => setDeactivateOpen(true)}
            sx={{ color: 'red', '&:hover': { backgroundColor: '#7f1d1d' } }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </div>
      )}

      <UserEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSave={onUpdate}
      />

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={onDeactivate}
        title="Benutzer deaktivieren?"
        description={`Möchtest du ${user.name} wirklich deaktivieren?`}
      />
    </div>
  );
}

type UserEditDialogProps = {
  open: boolean;
  onClose: () => void;
  user: ApiGetUsersResponse[number];
  onSave: (updated: ApiUserPutResponse) => void;
};

export function UserEditDialog({
  open,
  onClose,
  user,
  onSave,
}: UserEditDialogProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const { handleImageUpload, previewUrl, uploading, error } = useImageUpload();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await handleImageUpload(file);
    if (base64) {
      try {
        await axios.post(`/api/users/${user.id}/uploadImage`, {
          file: base64,
        });
        showSuccess('Profilbild erfolgreich aktualisiert');
      } catch (error) {
        console.error('Error uploading image:', error);
        showError('Fehler beim Hochladen des Profilbilds');
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put<ApiUserPutResponse>(
        `/api/users/${user.id}`,
        {
          name,
          email,
        }
      );
      onSave(data);
      showSuccess('Benutzer erfolgreich aktualisiert');
      onClose();
    } catch (error) {
      showError('Fehler beim Aktualisieren des Benutzers');
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slots={{ transition: DialogTransition }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Benutzer bearbeiten
      </DialogTitle>
      <DialogContent>
        <div className="flex flex-col items-center gap-5 mb-6">
          <Avatar
            src={previewUrl || user?.image || undefined}
            sx={{ width: 100, height: 100 }}
          />
          <Button
            component="label"
            variant="outlined"
            color="info"
            loading={uploading}
            disabled={uploading}
          >
            Profilbild hochladen
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <TextField
          label="Name"
          fullWidth
          variant="outlined"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <Button fullWidth onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          fullWidth
          loading={loading}
          color="secondary"
          onClick={handleSave}
          variant="contained"
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
