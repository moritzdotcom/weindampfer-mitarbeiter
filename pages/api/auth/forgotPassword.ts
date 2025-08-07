import sendResetPasswordMail from '@/lib/mailer/resetPasswordMail';
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
  const { email } = req.body;
  if (!email) return res.status(401).json('Wrong credentials');

  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    const token = await prisma.resetPasswordToken.create({
      data: {
        user: { connect: { id: user.id } },
      },
    });
    await sendResetPasswordMail(user.email, user.name, token.id);
    return res.json({ message: 'success' });
  }
  return res.status(401).json('Wrong credentials');
}
