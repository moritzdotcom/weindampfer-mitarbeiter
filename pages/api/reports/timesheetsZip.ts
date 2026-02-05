import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import type { NextApiRequest, NextApiResponse } from 'next';
import { endOfMonth, startOfMonth } from 'date-fns';
import { format } from 'date-fns';

import fs from 'fs';
import path from 'path';

import PDFDocument from 'pdfkit';
import archiver from 'archiver';

type Row = {
  date: Date;
  begin: Date;
  end: Date;
  minutes: number;
};

export const config = {
  api: {
    // wir streamen ZIP raus
    responseLimit: false,
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  if (session.role !== 'ADMIN') return res.status(403).json('Forbidden');

  if (req.method !== 'GET') {
    return res
      .status(405)
      .json(`The HTTP ${req.method} method is not supported at this route.`);
  }

  const { year, month } = req.query;

  const today = new Date();
  const requestedDate = new Date(
    `${year ?? today.getFullYear()}-${
      month ? Number(month) + 1 : today.getMonth() + 1
    }-01`,
  );

  const monthStart = startOfMonth(requestedDate);
  const monthEnd = endOfMonth(requestedDate);

  // Daten holen: nur Registrations im Monat, nicht cancelled, inkl Shift
  const users = await prisma.user.findMany({
    include: {
      registrations: {
        where: {
          status: { not: 'CANCELLED' },
          event: { date: { gte: monthStart, lte: monthEnd } },
        },
        select: {
          event: { select: { date: true } },
          shift: { select: { clockIn: true, clockOut: true } },
        },
      },
    },
    omit: { password: true },
  });

  const yyyy = requestedDate.getFullYear();
  const mm = String(requestedDate.getMonth() + 1).padStart(2, '0');
  const zipName = `Stundenzettel_${yyyy}_${mm}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    // falls schon am Stream: best effort
    try {
      res.status(500).end(String(err));
    } catch {
      // ignore
    }
  });

  archive.pipe(res);

  // Logo aus /public laden
  const logoPath = path.join(process.cwd(), 'public', 'km-logo.png');
  const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

  let appendedCount = 0;

  for (const user of users) {
    // gültige Schichten: beide Zeiten gesetzt
    const rows: Row[] = user.registrations
      .map((r) => {
        const ci = r.shift?.clockIn ?? null;
        const co = r.shift?.clockOut ?? null;
        if (!ci || !co) return null;
        const minutes = Math.max(0, Math.round((+co - +ci) / 60000));
        return { date: r.event.date, begin: ci, end: co, minutes };
      })
      .filter(Boolean) as Row[];

    // 1) keine Stunden -> kein PDF
    const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
    if (rows.length === 0 || totalMinutes === 0) continue;

    // sortieren nach Datum/Begin
    rows.sort((a, b) => +a.begin - +b.begin);

    const pdf = await buildTimesheetPdfBuffer({
      logoBuffer,
      employeeName: user.name,
      monthLabel: `${mm}-${yyyy}`, // MM-YYYY
      rows,
    });

    const safe = safeFilename(user.name);
    const pdfName = `Stundenzettel_${safe}_${yyyy}_${mm}.pdf`;

    archive.append(pdf, { name: pdfName });
    appendedCount++;
  }

  // Falls niemand Stunden hat: kleines readme rein, damit ZIP nicht leer wirkt
  if (appendedCount === 0) {
    archive.append(`Keine Stundenzettel für ${mm}-${yyyy} vorhanden.\n`, {
      name: `README_${yyyy}_${mm}.txt`,
    });
  }

  await archive.finalize();
}

// ---------- PDF Builder (1 Seite) ----------

async function buildTimesheetPdfBuffer(opts: {
  logoBuffer: Buffer | null;
  employeeName: string;
  monthLabel: string; // MM-YYYY
  rows: Row[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, left: 48, right: 48, bottom: 48 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const { left, right, top } = doc.page.margins;
    const usableWidth = pageWidth - left - right;

    // Logo oben rechts
    if (opts.logoBuffer) {
      try {
        const logoW = 75;
        doc.image(opts.logoBuffer, pageWidth - right - logoW, top - 10, {
          width: logoW,
        });
      } catch {
        // ignore logo errors
      }
    }

    // Header
    doc.font('Helvetica-Bold').fontSize(16).text('Stundenzettel', left, top);

    doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Name: ${opts.employeeName}`, left, top + 28)
      .text(`Monat: ${opts.monthLabel}`, left, top + 44);

    // Tabelle
    const tableTop = top + 78;
    const col = {
      date: 0.18,
      begin: 0.14,
      end: 0.14,
      work: 0.18,
      sign: 0.36,
    };

    const x = left;
    const wDate = usableWidth * col.date;
    const wBegin = usableWidth * col.begin;
    const wEnd = usableWidth * col.end;
    const wWork = usableWidth * col.work;
    const wSign = usableWidth * col.sign;

    const cols = [
      { key: 'date', label: 'Datum', width: wDate },
      { key: 'begin', label: 'Beginn', width: wBegin },
      { key: 'end', label: 'Ende', width: wEnd },
      { key: 'work', label: 'Arbeitszeit', width: wWork },
      { key: 'sign', label: 'Unterschrift', width: wSign },
    ];

    // Kopfzeile
    const headerH = 22;
    doc.lineWidth(1).rect(x, tableTop, usableWidth, headerH).stroke();

    doc.font('Helvetica-Bold').fontSize(10);

    let cx = x;
    for (const c of cols) {
      doc.text(c.label, cx + 6, tableTop + 6, {
        width: c.width - 12,
        align: 'left',
      });
      doc
        .moveTo(cx + c.width, tableTop)
        .lineTo(cx + c.width, tableTop + headerH)
        .stroke();
      cx += c.width;
    }

    // Body: wir zwingen 1 Seite -> rechnen Platz, passen Zeilenhöhe an, schneiden notfalls ab
    const bottomY = doc.page.height - doc.page.margins.bottom;
    const availableH = bottomY - (tableTop + headerH);

    // Startwerte
    let rowH = 20;
    let fontSize = 10;

    // Wenn zu viele Zeilen: kompakter
    const maxRowsAt20 = Math.floor(availableH / rowH);
    if (opts.rows.length > maxRowsAt20) {
      rowH = 16;
      fontSize = 9;
    }

    const maxRows = Math.max(1, Math.floor(availableH / rowH)) - 2;

    const visibleRows = opts.rows.slice(0, maxRows);
    const hiddenCount = Math.max(0, opts.rows.length - visibleRows.length);

    doc.font('Helvetica').fontSize(fontSize);

    let y = tableTop + headerH;

    // 👉 NEU: immer genau maxRows Zeilen rendern
    for (let i = 0; i < maxRows; i++) {
      const r = visibleRows[i] ?? null;

      // row outline
      doc.rect(x, y, usableWidth, rowH).stroke();

      // vertical lines
      let vx = x;
      for (const c of cols) {
        doc
          .moveTo(vx + c.width, y)
          .lineTo(vx + c.width, y + rowH)
          .stroke();
        vx += c.width;
      }

      // Inhalte (oder leer lassen)
      if (r) {
        const dateStr = format(r.date, 'dd.MM.yyyy');
        const beginStr = format(r.begin, 'HH:mm');
        const endStr = format(r.end, 'HH:mm');
        const workStr = minutesToHHMM(r.minutes);

        let tx = x;
        const padX = 6;
        const ty = y + (rowH - fontSize) / 2 - 1;

        doc.text(dateStr, tx + padX, ty, { width: wDate - 2 * padX });
        tx += wDate;
        doc.text(beginStr, tx + padX, ty, { width: wBegin - 2 * padX });
        tx += wBegin;
        doc.text(endStr, tx + padX, ty, { width: wEnd - 2 * padX });
        tx += wEnd;
        doc.text(workStr, tx + padX, ty, { width: wWork - 2 * padX });
        // Unterschrift bleibt leer
      }

      y += rowH;
    }

    // Hinweis, falls abgeschnitten
    if (hiddenCount > 0) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(
          `Hinweis: ${hiddenCount} weitere Einträge passen nicht auf eine Seite und wurden nicht angezeigt.`,
          x,
          y + 10,
          { width: usableWidth },
        );
    }

    // optional: Summenzeile unten
    const total = minutesToHHMM(opts.rows.reduce((s, r) => s + r.minutes, 0));
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Summe Arbeitszeit: ${total}`, x, bottomY - 18, {
        width: usableWidth,
        align: 'right',
      });

    doc.end();
  });
}

// ---------- helpers ----------

function minutesToHHMM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function safeFilename(name: string) {
  // "Maria Krebs" => "Maria_Krebs", Umlaute normalisieren, Sonderzeichen raus
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // diacritics
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
