import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json('Invalid request');

  const resetToken = await prisma.resetPasswordToken.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!resetToken) return res.status(404).json('Token not found');
  if (resetToken.createdAt.getTime() + 24 * 60 * 60 * 1000 < Date.now()) {
    // Token expired after 24 hours
    await prisma.resetPasswordToken.delete({ where: { id: token } });
    return res.status(400).json('Token expired');
  }
  const user = resetToken.user;
  if (!user) return res.status(404).json('User not found');

  await prisma.user.update({
    where: { id: user.id },
    data: { password },
  });

  await prisma.resetPasswordToken.delete({ where: { id: token } });

  return res.json({ message: 'Password reset successful' });
}
