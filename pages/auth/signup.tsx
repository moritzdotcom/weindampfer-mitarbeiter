import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ErrorMessage from '@/components/errorMessage';
import Link from 'next/link';
import { Session } from '@/hooks/useSession';
import { TextField } from '@mui/material';
import prisma from '@/lib/prismadb';
import { showSuccess } from '@/lib/toast';

export default function SignupPage({
  session,
  inviteId,
  email,
  invitedBy,
}: {
  session: Session;
  inviteId: string;
  email: string;
  invitedBy: string;
}) {
  const router = useRouter();
  const { status, signup } = session;
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
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
      await signup(name, password, inviteId);
      router.replace('/profile/edit');
      showSuccess('Erfolgreich registriert');
    } catch (error) {
      setSubmitError('Falsche Zugangsdaten');
    }
  };

  const validateInputs = () => {
    setPasswordError('');
    setPasswordConfirmationError('');
    setNameError('');
    let nameErr = '';
    let passwordErr = '';
    let passwordConfirmationErr = '';
    if (name) {
      if (name.length < 3) {
        nameErr = 'Mindestens 3 Zeichen';
      }
    } else {
      nameErr = 'Name darf nicht leer sein';
    }

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
    setNameError(nameErr);
    setPasswordError(passwordErr);
    setPasswordConfirmationError(passwordConfirmationErr);
    return !nameErr && !passwordErr && !passwordConfirmationErr;
  };

  useEffect(() => {
    if (formDirty) validateInputs();
  }, [name, password, passwordConfirmation]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 h-[80vh] sm:h-screen flex flex-col justify-center">
      <img
        src="/logo-white.png"
        alt="WEINDAMPFER"
        className="w-72 mx-auto mb-8"
      />
      <h3 className="mt-4 text-xl text-center font-light font-cocogoose">
        {invitedBy} hat dich eingeladen, dem Weindampfer Schichtplan
        beizutreten.
      </h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-5 mt-8">
        <div>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoComplete="name"
          />
          <ErrorMessage message={nameError} />
        </div>
        <div>
          <TextField fullWidth label="Email" value={email} disabled />
        </div>
        <div>
          <TextField
            fullWidth
            label="Passwort"
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
            label="Passwort Bestätigen"
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
          Registrieren
        </button>
        <Link
          href="/auth/login"
          className="text-center border-2 border-white text-white px-3 py-3 rounded-md"
        >
          Anmelden
        </Link>
      </form>
    </div>
  );
}

export async function getServerSideProps(context: {
  query: { inviteId?: string };
}) {
  const { inviteId } = context.query;
  if (!inviteId) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const invite = await prisma.userInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: { inviteId, email: invite.email, invitedBy: invite.invitedBy },
  };
}
