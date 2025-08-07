import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ErrorMessage from '@/components/errorMessage';
import { TextField } from '@mui/material';
import { GetServerSidePropsContext } from 'next';
import axios from 'axios';

export default function ResetPasswordPage({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] =
    useState('');
  const [formDirty, setFormDirty] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitError('');
    e.preventDefault();
    setFormDirty(true);
    if (!validateInputs()) return;
    try {
      await axios.post('/api/auth/resetPassword', {
        token,
        password,
      });
      router.push('/auth/login');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific error messages from the API
        if (typeof error.response.data === 'string') {
          setSubmitError(error.response.data);
        } else if (error.response.data.message) {
          setSubmitError(error.response.data.message);
        } else {
          setSubmitError(
            'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
          );
        }
      } else {
        // Handle general errors
        console.error('Unexpected error:', error);
        setSubmitError('Etwas ist schiefgelaufen');
      }
    }
  };

  const validateInputs = () => {
    setPasswordError('');
    setPasswordConfirmationError('');
    let passwordErr = '';
    let passwordConfirmationErr = '';

    if (password) {
      if (password.length < 8) {
        passwordErr = 'Mindestens 8 Zeichen';
      }
    } else {
      passwordErr = 'Passwort darf nicht leer sein';
    }
    if (passwordConfirmation) {
      if (passwordConfirmation !== password) {
        passwordConfirmationErr = 'Passwörter stimmen nicht überein';
      }
    } else {
      passwordConfirmationErr = 'Passwort Bestätigung darf nicht leer sein';
    }
    setPasswordError(passwordErr);
    setPasswordConfirmationError(passwordConfirmationErr);
    return !passwordErr && !passwordConfirmationErr;
  };

  useEffect(() => {
    if (formDirty) validateInputs();
  }, [password, passwordConfirmation]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 h-[80vh] sm:h-screen flex flex-col justify-center">
      <img
        src="/logo-white.png"
        alt="WEINDAMPFER"
        className="w-72 mx-auto mb-8"
      />
      <h3 className="mt-4 text-2xl text-center font-light font-cocogoose">
        Passwort zurücksetzen
      </h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-5 mt-8">
        <div>
          <TextField
            fullWidth
            placeholder="Passwort"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <ErrorMessage message={passwordError} />
        </div>
        <div>
          <TextField
            fullWidth
            placeholder="Passwort Bestätigen"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.currentTarget.value)}
          />
          <ErrorMessage message={passwordConfirmationError} />
        </div>
        <ErrorMessage message={submitError} />
        <button
          className="mt-5 bg-white text-black px-3 py-3 rounded-md"
          type="submit"
        >
          Passwort speichern
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { token } = context.query;
  if (!token) {
    return {
      redirect: {
        destination: '/auth/forgotPassword',
        permanent: false,
      },
    };
  }

  return { props: { token } };
}
