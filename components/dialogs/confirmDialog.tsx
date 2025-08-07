import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogProps,
} from '@mui/material';
import DialogTransition from './transition';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
} & Partial<DialogProps>;

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Bist du sicher?',
  description = 'Diese Aktion kann nicht rückgängig gemacht werden.',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  loading = false,
  ...props
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slots={{ transition: DialogTransition }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 2,
          },
        },
      }}
      {...props}
    >
      <DialogTitle sx={{ fontWeight: 600, textAlign: 'center' }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', fontSize: 14 }}>
        {description}
      </DialogContent>
      <DialogActions>
        <Button fullWidth onClick={onClose} sx={{ borderRadius: 3 }}>
          {cancelText}
        </Button>
        <Button
          fullWidth
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: 3 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
