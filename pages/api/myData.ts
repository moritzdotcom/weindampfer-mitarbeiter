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
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetMyDataResponse = Prisma.EventGetPayload<{
  include: {
    registrations: {
      include: {
        shift: true;
        user: {
          select: { id: true; name: true; image: true };
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
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const data = await prisma.event.findMany({
    where: { date: { gte: yesterday } },
    include: {
      registrations: {
        where: { status: { not: 'CANCELLED' } },
        include: {
          shift: { where: { registration: { userId: id } } },
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  });

  return res.json(data);
}
