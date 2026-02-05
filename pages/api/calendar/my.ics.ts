import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';

export const config = {
  api: { responseLimit: false },
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// UTC im ICS Format: YYYYMMDDTHHMMSSZ
function toICSDateUTC(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

// Text escapen (Kommas, Semikolons, Newlines)
function icsEscape(s: string) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).end('Not authenticated');

  if (req.method !== 'GET') return res.status(405).end('Method not allowed');

  const onlyFuture = req.query.onlyFuture !== 'false';
  const now = new Date();

  const regs = await prisma.registration.findMany({
    where: {
      userId: session.id,
      status: { not: 'CANCELLED' },
      ...(onlyFuture ? { event: { startTime: { gte: now } } } : {}),
    },
    select: {
      id: true,
      event: {
        select: {
          id: true,
          name: true,
          date: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { event: { startTime: 'asc' } },
  });

  // Minimaler, gut kompatibler ICS-Feed (UTC Zeiten)
  const dtStamp = toICSDateUTC(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Weindampfer//Mitarbeiter App//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const r of regs) {
    const e = r.event;
    // UID sollte stabil sein, damit Kalender Updates erkennt
    const uid = `${e.id}@weindampfer`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`SUMMARY:${icsEscape(e.name)}`);

    // Wenn du Location/Description hast, hier rein:
    // lines.push(`LOCATION:${icsEscape('Düsseldorf')}`);
    // lines.push(`DESCRIPTION:${icsEscape('Weindampfer Schicht')}`);

    lines.push(`DTSTART:${toICSDateUTC(new Date(e.startTime))}`);
    lines.push(`DTEND:${toICSDateUTC(new Date(e.endTime))}`);

    // optional: Link zurück in deine App
    lines.push(
      `URL:${icsEscape(`${process.env.PUBLIC_URL}registrations/${r.id}`)}`,
    );

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const ics = lines.join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="weindampfer-events.ics"`,
  );
  res.status(200).send(ics);
}
