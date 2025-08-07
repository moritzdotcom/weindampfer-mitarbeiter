import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/generated/prisma';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res, session.id);
  } else if (req.method === 'PUT') {
    if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');
    await handlePUT(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
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
  userId: string
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

async function handlePUT(req: NextApiRequest, res: NextApiResponse) {
  const { status } = req.body;
  const registrationId = req.query.registrationId as string;
  if (!registrationId)
    return res.status(400).json('Registration ID is required');

  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'CANCEL_REQUESTED',
    },
    include: {
      shift: true,
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });
  return res.status(201).json(registration);
}
