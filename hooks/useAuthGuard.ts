import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Session } from '@/hooks/useSession';
import { UserRole } from '@/generated/prisma';

export function useAuthGuard(
  session: Session,
  requiredRole: UserRole = 'USER'
) {
  const router = useRouter();

  const validateRole = (userHas: UserRole, required: UserRole) => {
    if (required === 'ADMIN') {
      return userHas === 'ADMIN';
    } else if (required === 'USER') {
      return userHas === 'ADMIN' || userHas === 'USER';
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (
      session.status === 'authenticated' &&
      !validateRole(session.user.role, requiredRole)
    ) {
      router.push('/');
    }
  }, [session.status, router.isReady]);
}
