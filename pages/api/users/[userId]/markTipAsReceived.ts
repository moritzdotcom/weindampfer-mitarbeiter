import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  const { userId } = req.query;
  if (typeof userId !== 'string')
    return res.status(400).json('Invalid User ID');

  if (req.method === 'PUT') {
    await handlePUT(req, res, userId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const updated = await prisma.shift.updateMany({
    where: { registration: { userId: id }, tipReceived: false },
    data: {
      tipReceived: true,
    },
  });

  return res.status(201).json(updated);
}
