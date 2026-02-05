import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fitCanvasToTarget(
  source: HTMLCanvasElement,
  targetW: number,
  targetH: number,
) {
  const out = document.createElement('canvas');
  out.width = targetW;
  out.height = targetH;

  const ctx = out.getContext('2d')!;
  ctx.clearRect(0, 0, targetW, targetH);

  const scale = Math.min(targetW / source.width, targetH / source.height);
  const drawW = Math.floor(source.width * scale);
  const drawH = Math.floor(source.height * scale);

  const dx = Math.floor((targetW - drawW) / 2);
  const dy = Math.floor((targetH - drawH) / 2);

  ctx.drawImage(
    source,
    0,
    0,
    source.width,
    source.height,
    dx,
    dy,
    drawW,
    drawH,
  );
  return out;
}

export default function SignatureDialog({
  open,
  onClose,
  onConfirm,
  title = 'Bitte unterschreiben',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrlPng: string) => void;
  title?: string;
}) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Layout-Parameter
  const MAX_WIDTH = 560; // ✅ hard max width fürs Feld (Desktop)
  const ASPECT = 3; // 3:1
  const HARD_MAX_H = 220; // ✅ nicht zu hoch (Mobile)
  const EXPORT_W = 1200; // Exportgröße für PDF (3:1)
  const EXPORT_H = 400;

  const [cssSize, setCssSize] = useState({ w: 0, h: 0 });

  // Kein Scrollen / kein Pull-to-refresh-Gefrickel
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const el = bottomRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      // verfügbare Breite der Bottom-Area minus Padding
      const availW = Math.max(0, rect.width - 32); // p:2 links/rechts
      const w = Math.floor(Math.min(availW, MAX_WIDTH));
      let h = Math.floor(w / ASPECT);

      if (h > HARD_MAX_H) {
        h = HARD_MAX_H;
      }

      setCssSize({ w, h });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [open]);

  // ✅ Pen thickness abhängig von Feldbreite
  const pen = useMemo(() => {
    const w = cssSize.w || 320;
    const base = 1.6 + w / 260; // sanft hoch
    return {
      minWidth: clamp(base * 0.9, 2.4, 7.0),
      maxWidth: clamp(base * 1.4, 3.4, 10.0),
      dotSize: clamp(base * 0.9, 2.4, 7.0),
    };
  }, [cssSize.w]);

  // ✅ HiDPI Canvas setup, aber capped (sonst zu große Dateien)
  useEffect(() => {
    if (!open) return;
    const pad = sigRef.current;
    if (!pad) return;

    const canvas = pad.getCanvas();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    const { w: cssW, h: cssH } = cssSize;
    if (!cssW || !cssH) return;

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * ratio);
    canvas.height = Math.floor(cssH * ratio);

    pad.clear();
  }, [open, cssSize.w, cssSize.h]);

  const clear = () => sigRef.current?.clear();

  const confirm = () => {
    const pad = sigRef.current;
    if (!pad || pad.isEmpty()) return;
    const trimmed = pad.getTrimmedCanvas();
    const normalized = fitCanvasToTarget(trimmed, EXPORT_W, EXPORT_H);
    const dataUrl = normalized.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar
          sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
        >
          <Typography variant="h6">{title}</Typography>
          <Button onClick={onClose}>Abbrechen</Button>
        </Toolbar>
      </AppBar>

      {/* ✅ Layout: oben Luft, unten Sign-Bereich + Buttons */}
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#0a0a0a',
        }}
      >
        {/* Spacer / Content area */}
        <Box sx={{ flex: 1 }} />

        {/* Bottom area */}
        <Box
          ref={bottomRef}
          sx={{
            p: 2,
            pb: 3,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            bgcolor: '#0a0a0a',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: cssSize.w ? `${cssSize.w}px` : '100%',
                height: cssSize.h ? `${cssSize.h}px` : 160,
                maxWidth: `${MAX_WIDTH}px`,
                borderRadius: 2,
                bgcolor: '#fff',
                overflow: 'hidden',
                touchAction: 'none',
              }}
            >
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                minWidth={pen.minWidth}
                maxWidth={pen.maxWidth}
                dotSize={pen.dotSize}
                canvasProps={{
                  style: { width: '100%', height: '100%' },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={clear}>
              Löschen
            </Button>
            <Button fullWidth variant="contained" onClick={confirm}>
              Unterschrift bestätigen
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
