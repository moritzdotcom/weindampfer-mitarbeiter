import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  const { eventId } = req.query;
  if (typeof eventId !== 'string')
    return res.status(400).json('Event ID is required');

  if (req.method === 'GET') {
    await handleGET(req, res, eventId);
  } else if (req.method === 'PUT') {
    await handlePUT(req, res, eventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetEventAdminResponse = Prisma.EventGetPayload<{
  include: {
    registrations: {
      include: {
        shift: { include: { changeRequest: true } };
        user: { select: { name: true; image: true } };
      };
    };
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          shift: {
            include: { changeRequest: { where: { status: 'PENDING' } } },
          },
          user: { select: { name: true, image: true } },
        },
      },
    },
  });

  return res.json(event);
}

export type ApiPutEventAdminResponse = Prisma.EventGetPayload<{}>;

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const event = await prisma.event.update({
    where: { id },
    data: {
      name: req.body.name,
      date: req.body.date ? new Date(req.body.date) : undefined,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      peopleRequired: req.body.peopleRequired,
      totalTip: req.body.totalTip,
    },
  });
  return res.json(event);
}
