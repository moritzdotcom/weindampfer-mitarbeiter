import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const registrationId = req.query.registrationId as string;
  if (!registrationId)
    return res.status(400).json('Registration ID is required');

  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'REGISTERED',
    },
  });
  return res.status(201).json(registration);
}
