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

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  name: string,
  id: string
) {
  await prisma.shiftChangeRequest.update({
    where: { id },
    data: { status: 'REJECTED', changeApprovedBy: name },
  });

  return res.status(201).json('REJECTED');
}
