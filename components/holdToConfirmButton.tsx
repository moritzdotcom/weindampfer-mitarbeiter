import * as React from 'react';
import Button from '@mui/material/Button';
import { EventBusy } from '@mui/icons-material';

type HoldToConfirmButtonProps = {
  onConfirm: () => void;
  seconds?: number;
  label?: string;
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
  variant?: 'text' | 'outlined' | 'contained';
  startIcon?: React.ReactNode;
  disabled?: boolean;
};

export function HoldToConfirmButton({
  onConfirm,
  seconds = 5,
  label = 'Event absagen',
  color = 'error',
  variant = 'outlined',
  startIcon = <EventBusy />,
  disabled,
}: HoldToConfirmButtonProps) {
  const [holding, setHolding] = React.useState(false);
  const [remaining, setRemaining] = React.useState(seconds);
  const [amplitude, setAmplitude] = React.useState(0);
  const holdTimerRef = React.useRef<number | null>(null);
  const tickIntervalRef = React.useRef<number | null>(null);

  const clearTimers = React.useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const cancelHold = React.useCallback(() => {
    clearTimers();
    setHolding(false);
    setRemaining(seconds);
    setAmplitude(0);
  }, [clearTimers, seconds]);

  const startHold = React.useCallback(() => {
    if (disabled) return;
    setHolding(true);
    setRemaining(seconds);
    setAmplitude(2);

    tickIntervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        setAmplitude((amp) => Math.min(20, (seconds - next) * 2));
        return next;
      });
    }, 1000) as unknown as number;

    holdTimerRef.current = window.setTimeout(() => {
      clearTimers();
      setHolding(false);
      setAmplitude(0);
      setRemaining(seconds);
      onConfirm();
    }, seconds * 1000) as unknown as number;
  }, [disabled, seconds, onConfirm, clearTimers]);

  const onPointerDown = () => startHold();
  const onPointerUp = () => cancelHold();
  const onPointerLeave = () => cancelHold();
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startHold();
  };
  const onTouchEnd = () => cancelHold();

  const labelText = holding ? `Gedrückt halten… (${remaining}s)` : label;

  return (
    <Button
      variant={variant}
      color={color}
      startIcon={startIcon}
      disabled={disabled}
      onMouseDown={onPointerDown}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={holding ? 'hold-wobble' : undefined}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '--shake-deg': `${Math.min(amplitude / 4, 6)}deg` as any, // maximale Neigung ~6°
        transformOrigin: 'center bottom',
      }}
    >
      <span>{labelText}</span>

      {holding && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            height: 3,
            width: `${((seconds - remaining) / seconds) * 100}%`,
            background: 'currentColor',
            opacity: 0.35,
            transition: 'width 250ms linear',
          }}
        />
      )}

      <style>{`
        @keyframes btn-wobble {
          0%   { transform: rotateZ(0deg); }
          25%  { transform: rotateZ(var(--shake-deg)); }
          50%  { transform: rotateZ(calc(var(--shake-deg) * -1)); }
          75%  { transform: rotateZ(var(--shake-deg)); }
          100% { transform: rotateZ(0deg); }
        }
        .hold-wobble {
          animation: btn-wobble 400ms ease-in-out infinite;
        }
      `}</style>
    </Button>
  );
}
