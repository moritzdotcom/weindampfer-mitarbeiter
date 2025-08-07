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

  const inviteId = req.query.inviteId as string;
  if (!inviteId) return res.status(400).json('Invite ID is required');

  if (req.method === 'DELETE') {
    await handleDELETE(req, res, inviteId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiDeleteInviteResponse = Prisma.UserInviteGetPayload<{}>;

async function handleDELETE(
  req: NextApiRequest,
  res: NextApiResponse,
  inviteId: string
) {
  const invite = await prisma.userInvite.delete({
    where: { id: inviteId },
  });

  if (!invite) {
    return res.status(404).json('Invite not found');
  }

  return res.json(invite);
}
