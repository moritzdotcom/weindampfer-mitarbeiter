// theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // iOS Blau
    },
    secondary: {
      main: '#10b981', // iOS Grün
    },
    background: {
      default: '#000000', // App-Hintergrund schwarz
      paper: '#111827', // Dialoge/Panels dunkel
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af', // Tailwind text-gray-300
    },
    divider: '#374151', // Tailwind gray-700
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Text"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'var(--color-neutral-800)',
          color: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: '1rem',
        },
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#9ca3af',
          '&.Mui-focused': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--color-neutral-800)',
          color: '#ffffff',
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9ca3af',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d1d5db',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffffff',
          },
        },
        input: {
          color: '#ffffff',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '16.5px 14px',
          color: '#ffffff',
        },
        icon: {
          color: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
          padding: '8px 16px',
          textTransform: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: 'var(--color-neutral-50)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          '&::before, &::after': {
            borderColor: 'var(--color-neutral-500)',
          },
          fontSize: '1.2rem',
        },
      },
    },
  },
});

export default theme;
