import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/generated/prisma';
import sendInvitationMail from '@/lib/mailer/invitationMail';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'POST') {
    await handlePOST(req, res, session.name);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetInvitesResponse = Prisma.UserInviteGetPayload<{
  select: { id: true; email: true; createdAt: true; invitedBy: true };
}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const invites = await prisma.userInvite.findMany({
    select: { id: true, email: true, createdAt: true, invitedBy: true },
  });

  return res.json(invites);
}

export type ApiPostInvitesResponse = {
  id: string;
  email: string;
  createdAt: Date;
  invitedBy: string;
};

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  userName: string
) {
  const { email } = req.body;
  if (!email) return res.status(400).json('Invalid request');

  try {
    const invite = await prisma.userInvite.create({
      data: {
        email,
        invitedBy: userName,
      },
    });

    await sendInvitationMail(email, invite.id, userName);

    return res.json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    return res.status(500).json('Internal server error');
  }
}
