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

  if (req.method === 'POST') {
    await handlePOST(req, res, session.id);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiRegistrationCancelRequestResponse =
  Prisma.RegistrationGetPayload<{
    include: {
      shift: true;
      user: {
        select: { id: true; name: true; image: true };
      };
    };
  }>;

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { reason } = req.body;
  const registrationId = req.query.registrationId as string;
  if (!registrationId)
    return res.status(400).json('Registration ID is required');

  const registration = await prisma.registration.update({
    where: { id: registrationId, userId },
    data: {
      cancelReason: reason,
      status: 'CANCEL_REQUESTED',
    },
    include: {
      shift: true,
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });
  return res.status(201).json(registration);
}
