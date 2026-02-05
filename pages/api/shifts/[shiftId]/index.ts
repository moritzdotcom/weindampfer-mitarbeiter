import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/generated/prisma';
import { supabase } from '@/lib/supabase';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { shiftId } = req.query;
  if (typeof shiftId !== 'string')
    return res.status(400).json('Invalid shift ID');

  if (req.method === 'PUT') {
    await handlePUT(req, res, shiftId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiPutShiftResponse = Prisma.ShiftGetPayload<{}>;

function dataUrlToBuffer(dataUrl: string) {
  const m = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!m) throw new Error('Invalid signature format');
  return Buffer.from(m[1], 'base64');
}

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const { clockOut, clockOutLat, clockOutLon, checkoutSignatureDataUrl } =
    req.body;

  const sigBuffer = dataUrlToBuffer(checkoutSignatureDataUrl);

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      registration: { select: { userId: true } },
    },
  });

  if (!shift) return res.status(400).json('No Shift for ID');

  const yyyy = new Date(clockOut).getFullYear();
  const mm = String(new Date(clockOut).getMonth() + 1).padStart(2, '0');
  const signaturePath = `${shift.registration.userId}/${yyyy}-${mm}/${shift.id}.png`;

  await supabase.storage.from('signatures').upload(signaturePath, sigBuffer, {
    contentType: 'image/png',
    upsert: true,
  });

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      clockOut: shift?.clockOut || clockOut,
      clockOutLat: shift?.clockOutLat || clockOutLat,
      clockOutLon: shift?.clockOutLon || clockOutLon,
      checkoutSignaturePath: signaturePath,
      checkoutSignedAt: new Date(),
    },
  });

  return res.status(201).json(updated);
}
