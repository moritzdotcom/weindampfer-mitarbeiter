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

  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json('Invalid shift ID');

  if (req.method === 'POST') {
    await handlePOST(req, res, session.name, id);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiApproveShiftChangeRequestResponse =
  Prisma.ShiftGetPayload<{}> & { changeRequest: null };

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  name: string,
  id: string
) {
  const shiftChangeRequest = await prisma.shiftChangeRequest.update({
    where: { id },
    data: { status: 'APPROVED', changeApprovedBy: name },
  });

  const shift = await prisma.shift.update({
    where: { id: shiftChangeRequest.shiftId },
    data: {
      clockIn: shiftChangeRequest.clockIn,
      clockOut: shiftChangeRequest.clockOut,
    },
  });

  return res.status(201).json({ ...shift, changeRequest: null });
}
