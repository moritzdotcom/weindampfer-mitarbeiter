import { Prisma } from '@/generated/prisma';
import sendNewEventMail from '@/lib/mailer/newEventMail';
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

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetEventsResponse = Prisma.EventGetPayload<{
  include: {
    _count: { select: { registrations: true } };
  };
}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const events = await prisma.event.findMany({
    where: { date: { gte: startOfYear } },
    include: {
      _count: { select: { registrations: true } },
    },
  });
  return res.json(events);
}

export type ApiPostEventResponse = Prisma.EventGetPayload<{}>;

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { name, date, startTime, endTime, peopleRequired } = req.body;
  if (!name || !date || !startTime || !endTime || !peopleRequired) {
    return res.status(400).json('Invalid request');
  }

  const event = await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      peopleRequired,
    },
  });

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { email: true },
  });

  if (users.length > 0) {
    await sendNewEventMail(
      users.map((u) => u.email),
      event.id,
      event.name,
      event.date.toLocaleDateString('de-DE')
    );
  }

  return res.json(event);
}
