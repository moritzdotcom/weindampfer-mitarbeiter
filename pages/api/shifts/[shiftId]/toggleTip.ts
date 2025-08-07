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

  const { shiftId } = req.query;
  if (typeof shiftId !== 'string')
    return res.status(400).json('Invalid shift ID');

  if (req.method === 'PUT') {
    await handlePUT(req, res, shiftId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiShiftToggleTipResponse = Prisma.ShiftGetPayload<{}>;

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { receivesTip } = req.body;

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      receivesTip,
    },
  });

  return res.status(201).json(updated);
}
