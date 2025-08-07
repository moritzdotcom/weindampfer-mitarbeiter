import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ErrorMessage from '@/components/errorMessage';
import Link from 'next/link';
import { Session } from '@/hooks/useSession';
import { TextField } from '@mui/material';
import axios from 'axios';

export default function ForgotPasswordPage({ session }: { session: Session }) {
  const router = useRouter();
  const { status } = session;
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formDirty, setFormDirty] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitError('');
    e.preventDefault();
    setFormDirty(true);
    if (!validateInputs()) return;
    try {
      await axios.post('/api/auth/forgotPassword', { email });
      setSuccessMessage(
        'Passwort-Reset Link wurde gesendet. Bitte schau in deine Emails.'
      );
    } catch (error) {
      setSubmitError('Diese Email ist nicht registriert');
    }
  };

  const validateInputs = () => {
    setEmailError('');
    let emailErr = '';
    if (email) {
      if (email.length < 3 || !/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
        emailErr = 'Ungültige Email-Adresse';
      }
    } else {
      emailErr = 'Email darf nicht leer sein';
    }
    setEmailError(emailErr);
    return !emailErr;
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router.isReady]);

  useEffect(() => {
    if (formDirty) validateInputs();
  }, [email]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 h-[80vh] sm:h-screen flex flex-col justify-center">
      <img
        src="/logo-white.png"
        alt="WEINDAMPFER"
        className="w-72 mx-auto mb-8"
      />
      <h3 className="mt-4 text-2xl text-center font-light font-cocogoose">
        Passwort vergessen
      </h3>
      {successMessage ? (
        <div className="w-full text-center text-xl rounded-md bg-neutral-600 px-2 py-5 mt-8">
          {successMessage}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5 mt-8">
          <div>
            <TextField
              fullWidth
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <ErrorMessage message={emailError} />
          </div>
          <ErrorMessage message={submitError} />
          <button
            className="mt-3 bg-white text-black px-3 py-3 rounded-md"
            type="submit"
          >
            Passwort zurücksetzen
          </button>
          <Link
            href="/auth/login"
            className="text-center border-2 border-white text-white px-3 py-3 rounded-md"
          >
            Anmelden
          </Link>
        </form>
      )}
    </div>
  );
}
