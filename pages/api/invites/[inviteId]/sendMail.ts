import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import sendInvitationMail from '@/lib/mailer/invitationMail';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  const inviteId = req.query.inviteId as string;
  if (!inviteId) return res.status(400).json('Invite ID is required');

  if (req.method === 'POST') {
    await handlePOST(req, res, inviteId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPostInviteSendMailResponse = {
  success: boolean;
  message: string;
};

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  inviteId: string
) {
  const invite = await prisma.userInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, email: true, invitedBy: true },
  });

  if (!invite) {
    return res.status(404).json('Invite not found');
  }

  await sendInvitationMail(invite.email, invite.id, invite.invitedBy);

  return res.json({
    success: true,
    message: `Invitation email sent to ${invite.email} by ${invite.invitedBy}`,
  });
}
