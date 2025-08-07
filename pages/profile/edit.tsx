import { useImageUpload } from '@/hooks/useImageUpload';
import { useEffect, useState } from 'react';
import { Button, TextField, Avatar, Divider } from '@mui/material';
import { useRouter } from 'next/router';
import { Session } from '@/hooks/useSession';
import { showError, showSuccess } from '@/lib/toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Link from 'next/link';
import { ArrowBackIos } from '@mui/icons-material';
import axios from 'axios';
import DialogTransition from '@/components/dialogs/transition';

export default function EditProfilePage({ session }: { session: Session }) {
  const { handleImageUpload, previewUrl, uploading, error } = useImageUpload();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await handleImageUpload(file);
    if (base64) {
      try {
        await axios.post('/api/users/uploadImage', {
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
    try {
      await axios.put('/api/users', {
        name,
        email,
      });
      showSuccess('Profil erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Fehler beim Aktualisieren des Profils');
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session.status === 'authenticated') {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session.status, router.isReady]);

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <Link
        className="text-white text-lg py-2 inline-flex items-center"
        href="/"
        title="Zurück zur Startseite"
      >
        <ArrowBackIos fontSize="inherit" />
        Zur Startseite
      </Link>
      <h1 className="text-3xl font-extralight my-6 text-center font-cocogoose">
        Dein <b>Profil</b>
      </h1>

      <div className="flex flex-col items-center gap-5 mb-6">
        <Avatar
          src={previewUrl || session?.user?.image || undefined}
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

      <div className="flex flex-col gap-6 mb-6">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <TextField
          label="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleSave}>
          Speichern
        </Button>
      </div>

      <Divider />

      <div className="flex flex-col gap-2 mt-6">
        <Button variant="outlined" onClick={() => setOpenPasswordDialog(true)}>
          Passwort ändern
        </Button>
        <Button variant="contained" color="error" onClick={session.logout}>
          Abmelden
        </Button>
      </div>

      <EditPasswordDialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
      />
    </div>
  );
}

function EditPasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }
    try {
      await axios.put('/api/users/password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
      showSuccess('Passwort erfolgreich geändert');
    } catch (err) {
      setError('Fehler beim Ändern des Passworts');
    }
  };

  return (
    <Dialog
      slots={{ transition: DialogTransition }}
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Passwort ändern</DialogTitle>
      <DialogContent>
        <TextField
          label="Aktuelles Passwort"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Neues Passwort"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Neues Passwort bestätigen"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        {error && <p className="text-red-500">{error}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSave} color="primary">
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
