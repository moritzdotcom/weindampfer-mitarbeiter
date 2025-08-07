import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // oder z.B. '10mb'
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const userId = session.id;

  if (req.method !== 'POST') return res.status(405).end();

  const file = req.body.file; // z. B. base64 oder multipart

  const match = file.match(/^data:(image\/\w+);base64,/);
  if (!match) return res.status(400).json({ error: 'Invalid image data' });

  const mimeType = match[1]; // z. B. "image/png"
  const extension = mimeType.split('/')[1]; // z. B. "png"

  if (!['jpeg', 'jpg', 'png', 'webp'].includes(extension))
    return res.status(400).json({ error: 'Unsupported file type' });

  const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const filename = `user_${userId}.${extension}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) return res.status(500).json({ error: error.message });

  const publicUrl = supabase.storage.from('avatars').getPublicUrl(data.path)
    .data.publicUrl;

  await prisma.user.update({
    where: { id: userId },
    data: { image: publicUrl },
  });

  return res.status(200).json({ url: publicUrl });
}
