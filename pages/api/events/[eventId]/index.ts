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

  const { eventId } = req.query;
  if (typeof eventId !== 'string')
    return res.status(400).json('Event ID is required');

  if (req.method === 'GET') {
    await handleGET(req, res, eventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetEventResponse = Prisma.EventGetPayload<{
  include: {
    registrations: {
      select: {
        id: true;
        helpsSetup: true;
        helpsTeardown: true;
        user: { select: { id: true; name: true; image: true } };
      };
    };
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  eventId: string
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        select: {
          id: true,
          helpsSetup: true,
          helpsTeardown: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  return res.json(event);
}
