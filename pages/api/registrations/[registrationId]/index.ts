import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/generated/prisma';
import sendRegistrationDeletedMail from '@/lib/mailer/registrationDeletedMail';
import { format } from 'date-fns';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res, session.id);
  } else if (req.method === 'DELETE') {
    if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');
    await handleDELETE(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetRegistrationResponse = Prisma.RegistrationGetPayload<{
  include: {
    shift: true;
    event: {
      include: {
        registrations: {
          select: {
            id: true;
            user: { select: { id: true; name: true; image: true } };
            helpsSetup: true;
            helpsTeardown: true;
          };
        };
      };
    };
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const registrationId = req.query.registrationId as string;
  if (!registrationId)
    return res.status(400).json('Registration ID is required');

  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, userId },
    include: {
      shift: true,
      event: {
        include: {
          registrations: {
            where: { status: { not: 'CANCELLED' } },
            select: {
              id: true,
              user: { select: { id: true, name: true, image: true } },
              helpsSetup: true,
              helpsTeardown: true,
            },
          },
        },
      },
    },
  });
  return res.status(201).json(registration);
}

async function handleDELETE(req: NextApiRequest, res: NextApiResponse) {
  const registrationId = req.query.registrationId as string;
  if (!registrationId)
    return res.status(400).json('Registration ID is required');

  const registration = await prisma.registration.delete({
    where: { id: registrationId },
    select: {
      event: {
        select: { name: true, date: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  await sendRegistrationDeletedMail(
    registration.user.email,
    registration.user.name,
    registration.event.name,
    format(new Date(registration.event.date), 'dd.MM.yyyy'),
  );
  return res.status(201).json(registration);
}
