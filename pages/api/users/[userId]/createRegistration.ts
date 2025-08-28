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
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json('User ID is required');

  if (req.method === 'POST') {
    await handlePOST(req, res, userId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiCreateRegistrationForUserResponse =
  Prisma.RegistrationGetPayload<{
    include: {
      shift: true;
      user: {
        select: { id: true; name: true; image: true };
      };
    };
  }>;

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { eventId, helpsSetup, helpsTeardown, clockIn, clockOut } = req.body;
  if (!eventId) return res.status(400).json('Invalid request');

  if ((clockIn && Date.parse(clockIn)) || (clockOut && Date.parse(clockOut))) {
    const registration = await prisma.registration.create({
      data: {
        event: { connect: { id: eventId } },
        user: { connect: { id } },
        helpsSetup,
        helpsTeardown,
        shift: {
          create: {
            clockIn,
            clockOut,
          },
        },
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
  const registration = await prisma.registration.create({
    data: {
      event: { connect: { id: eventId } },
      user: { connect: { id } },
      helpsSetup,
      helpsTeardown,
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
