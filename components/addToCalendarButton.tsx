import { Button } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function AddToCalendarButton() {
  return (
    <Button
      onClick={() => {
        window.location.href = '/api/calendar/my.ics?onlyFuture=true';
      }}
      startIcon={<CalendarMonthIcon />}
      sx={{
        borderRadius: 14,
        px: 3,
        py: 1.5,
        fontSize: '0.95rem',
        fontWeight: 500,
        textTransform: 'none',
        color: '#fff',
        background: 'linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 16px rgba(0,0,0,0.35)',
        '&:hover': {
          background: 'linear-gradient(180deg, #3a3a3c 0%, #2c2c2e 100%)',
        },
        '&:active': {
          transform: 'scale(0.97)',
        },
      }}
    >
      Zum Kalender hinzufügen
    </Button>
  );
}
