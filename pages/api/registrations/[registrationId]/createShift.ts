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

  const registrationId = req.query.registrationId as string;
  if (!registrationId) return res.status(400).json('User ID is required');

  if (req.method === 'POST') {
    await handlePOST(req, res, registrationId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPostShiftResponse = Prisma.ShiftGetPayload<{}>;

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { clockIn, clockOut } = req.body;

  const shift = await prisma.shift.create({
    data: {
      registration: { connect: { id } },
      clockIn,
      clockOut,
    },
  });

  return res.status(201).json(shift);
}
