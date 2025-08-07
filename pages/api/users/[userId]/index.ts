import { getServerSession, hashPassword } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma, UserRole } from '@/generated/prisma';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json('User ID is required');

  if (req.method === 'GET') {
    await handleGET(req, res, userId);
  } else if (req.method === 'PUT') {
    await handlePUT(req, res, userId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetUserResponse = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true; image: true; role: true };
}>[];

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const user = await prisma.user.findFirst({
    where: { id },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return res.json(user);
}

export type ApiUserPutResponse = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
};

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { name, email } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
    return res.json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code == 'P2002')
        return res.status(500).json('Email bereits vergeben');
      return res.status(500).json(error.message);
    } else {
      res.status(500).json('Unbekannter Fehler');
    }
  }
}
