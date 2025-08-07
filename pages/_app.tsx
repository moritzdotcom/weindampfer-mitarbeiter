import UseSession from '@/hooks/useSession';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material';
import theme from '@/theme';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  const session = UseSession();

  const appProps = Object.assign(
    {
      session,
    },
    pageProps
  );

  return (
    <ThemeProvider theme={theme}>
      <Component {...appProps} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#1f2937', // bg-gray-800
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // green
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red
              secondary: '#ffffff',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}
