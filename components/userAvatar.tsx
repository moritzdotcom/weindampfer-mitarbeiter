import { Avatar, AvatarProps } from '@mui/material';

type User = {
  name?: string | null;
  image?: string | null;
};

type UserAvatarProps = {
  user: User;
} & AvatarProps;

export default function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar
      src={user.image || undefined}
      alt={user.name || undefined}
      {...props}
    >
      {user.name?.[0]?.toUpperCase() || '👤'}
    </Avatar>
  );
}
