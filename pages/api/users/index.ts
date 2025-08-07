import { getServerSession, hashPassword } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma, UserRole } from '@/generated/prisma';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'POST') {
    await handlePOST(req, res);
  } else if (req.method === 'PUT') {
    await handlePUT(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetUsersResponse = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true; image: true; role: true };
}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return res.json(users);
}

export type ApiUsersPostResponse = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { name, password, inviteId } = req.body;
  if (!name || !password || !inviteId)
    return res.status(400).json('Invalid request');

  try {
    try {
      const userInvite = await prisma.userInvite.delete({
        where: { id: inviteId },
      });
      const user = await prisma.user.create({
        data: {
          name,
          email: userInvite.email,
          password: hashPassword(password),
        },
      });

      const session = await prisma.session.create({
        data: {
          user: { connect: user },
        },
      });
      res.setHeader('Set-Cookie', [
        `sessionId=${session.id}; path=/; HttpOnly; Max-Age=31536000`,
        `userId=${user.id}; path=/; HttpOnly; Max-Age=31536000`,
      ]);

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      });
    } catch (error) {
      return res.status(400).json('Not Invited');
    }
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

export type ApiUsersPutResponse = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
};

async function handlePUT(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { name, email, password, newPassword } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user) return res.status(404).json('User Not Found');

  if (password && newPassword && user.password !== hashPassword(password))
    return res.status(401).json('Invalid Password');

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        password: newPassword ? hashPassword(newPassword) : undefined,
      },
    });
    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      role: updatedUser.role,
    });
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
