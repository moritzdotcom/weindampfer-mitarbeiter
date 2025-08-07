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

  const userId = req.query.userId as string;
  const id = userId && session.role == 'ADMIN' ? userId : session.id;

  if (req.method === 'GET') {
    await handleGET(req, res, id);
  } else if (req.method === 'POST') {
    await handlePOST(req, res, session.id);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetRegistrationsResponse = Prisma.RegistrationGetPayload<{
  select: {
    id: true;
    status: true;
    createdAt: true;
    shift: {
      include: {
        changeRequest: true;
      };
    };
    event: {
      select: {
        name: true;
        date: true;
        totalTip: true;
        registrations: {
          select: {
            shift: {
              select: {
                clockIn: true;
                clockOut: true;
                receivesTip: true;
              };
            };
          };
        };
      };
    };
  };
}>[];

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const registrations = await prisma.registration.findMany({
    where: { userId: id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      shift: {
        include: {
          changeRequest: true,
        },
      },
      event: {
        select: {
          name: true,
          date: true,
          totalTip: true,
          registrations: {
            where: { status: { not: 'CANCELLED' } },
            select: {
              shift: {
                select: {
                  clockIn: true,
                  clockOut: true,
                  receivesTip: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return res.status(201).json(registrations);
}

export type ApiPostRegistrationResponse = Prisma.RegistrationGetPayload<{
  include: {
    user: {
      select: { id: true; name: true; image: true };
    };
  };
}> & { shift: null };

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { eventId, helpsSetup, helpsTeardown } = req.body;
  if (!eventId) return res.status(400).json('Invalid request');

  const registration = await prisma.registration.create({
    data: {
      event: { connect: { id: eventId } },
      user: { connect: { id } },
      helpsSetup,
      helpsTeardown,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return res.status(201).json({ ...registration, shift: null });
}
