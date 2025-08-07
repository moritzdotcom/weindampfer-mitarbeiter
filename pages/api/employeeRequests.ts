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

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetEmployeeRequestsResponse = {
  shifts: Prisma.ShiftChangeRequestGetPayload<{
    include: {
      shift: {
        include: {
          registration: {
            select: {
              event: true;
              user: { select: { id: true; name: true } };
            };
          };
        };
      };
    };
  }>[];
  registrations: Prisma.RegistrationGetPayload<{
    select: { id: true; event: true; user: true; cancelReason: true };
  }>[];
};

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const shiftChangeRequests = await prisma.shiftChangeRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      shift: {
        include: {
          registration: {
            select: {
              event: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  const registrationCancelRequests = await prisma.registration.findMany({
    where: { status: 'CANCEL_REQUESTED' },
    select: { id: true, event: true, user: true, cancelReason: true },
  });

  return res.json({
    shifts: shiftChangeRequests,
    registrations: registrationCancelRequests,
  });
}
