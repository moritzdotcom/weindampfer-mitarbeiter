import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ErrorMessage from '@/components/errorMessage';
import Link from 'next/link';
import { Session } from '@/hooks/useSession';
import { TextField } from '@mui/material';

export default function LoginPage({ session }: { session: Session }) {
  const router = useRouter();
  const { status, login } = session;
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formDirty, setFormDirty] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitError('');
    e.preventDefault();
    setFormDirty(true);
    if (!validateInputs()) return;
    try {
      await login(email, password);
    } catch (error) {
      setSubmitError('Falsche Zugangsdaten');
    }
  };

  const validateInputs = () => {
    setEmailError('');
    setPasswordError('');
    let emailErr = '';
    let passwordErr = '';
    if (email) {
      if (email.length < 3 || !/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
        emailErr = 'Ungültige Email-Adresse';
      }
    } else {
      emailErr = 'Email darf nicht leer sein';
    }

    if (password) {
      if (password.length < 8) {
        passwordErr = 'Mindestens 8 Zeichen';
      }
    } else {
      passwordErr = 'Passwort darf nicht leer sein';
    }
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    return !(emailErr || passwordErr);
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router.isReady]);

  useEffect(() => {
    if (formDirty) validateInputs();
  }, [email, password]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 h-[80vh] sm:h-screen flex flex-col justify-center">
      <img
        src="/logo-white.png"
        alt="WEINDAMPFER"
        className="w-72 mx-auto mb-8"
      />
      <h3 className="mt-4 text-2xl text-center font-light font-cocogoose">
        Login
      </h3>
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
        <div>
          <TextField
            fullWidth
            placeholder="Passwort"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <ErrorMessage message={passwordError} />
        </div>
        <ErrorMessage message={submitError} />
        <button
          className="mt-5 bg-white text-black px-3 py-3 rounded-md"
          type="submit"
        >
          Anmelden
        </button>
        <Link href="/auth/forgotPassword" className="text-center">
          Passwort vergessen?
        </Link>
      </form>
    </div>
  );
}
