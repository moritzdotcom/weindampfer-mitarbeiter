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

  const { shiftId } = req.query;
  if (typeof shiftId !== 'string')
    return res.status(400).json('Invalid shift ID');

  if (req.method === 'POST') {
    await handlePOST(req, res, shiftId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPostShiftChangeRequestResponse =
  Prisma.ShiftChangeRequestGetPayload<{}>;

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { clockIn, clockOut } = req.body;

  const shiftChangeRequest = await prisma.shiftChangeRequest.create({
    data: {
      shift: { connect: { id } },
      clockIn: new Date(clockIn),
      clockOut: new Date(clockOut),
    },
  });

  return res.status(201).json(shiftChangeRequest);
}
