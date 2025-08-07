import { Button, ButtonProps } from '@mui/material';
import { ReactNode } from 'react';
import { SxProps, Theme } from '@mui/system';

interface ActionButtonProps extends ButtonProps {
  icon: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function ActionButton({
  icon,
  children,
  sx,
  ...props
}: ActionButtonProps) {
  return (
    <Button
      {...props}
      variant={props.variant || 'outlined'}
      size={props.size || 'small'}
      startIcon={icon}
      sx={{
        borderRadius: 9999,
        textTransform: 'none',
        fontSize: '0.75rem',
        fontWeight: 500,
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}
