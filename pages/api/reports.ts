import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/generated/prisma';
import { endOfMonth, startOfMonth } from 'date-fns';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetReportsResponse = Prisma.UserGetPayload<{
  include: {
    registrations: {
      select: {
        id: true;
        event: { select: { id: true; name: true; date: true } };
        shift: { select: { clockIn: true; clockOut: true } };
      };
    };
  };
  omit: { password: true };
}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { year, month } = req.query;
  const today = new Date();
  const requestedDate = new Date(
    `${year ?? today.getFullYear()}-${
      month ? Number(month) + 1 : today.getMonth() + 1
    }-01`
  );
  const monthStart = startOfMonth(requestedDate);
  const monthEnd = endOfMonth(requestedDate);

  const data = await prisma.user.findMany({
    include: {
      registrations: {
        where: {
          status: { not: 'CANCELLED' },
          event: { date: { gte: monthStart, lte: monthEnd } },
        },
        select: {
          id: true,
          event: { select: { id: true, name: true, date: true } },
          shift: { select: { clockIn: true, clockOut: true } },
        },
      },
    },
    omit: { password: true },
  });

  return res.json(data);
}
