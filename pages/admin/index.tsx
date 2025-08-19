import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { Grid } from '@mui/material';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BackHandIcon from '@mui/icons-material/BackHand';

export default function AdminPage({ session }: { session: Session }) {
  useAuthGuard(session, 'ADMIN');

  return (
    <div className="w-full max-w-2xl mx-auto px-3 mt-10 mb-5 flex flex-col gap-7">
      <div>
        <Link href="/">
          <img
            src="/logo-white.png"
            alt="WEINDAMPFER"
            className="w-64 mx-auto mb-6"
          />
        </Link>
        <h2 className="text-2xl text-center font-light font-cocogoose">
          Admin
        </h2>
      </div>
      <Grid container spacing={4} justifyContent="center">
        <LinkItem
          href="/admin/events"
          text="Veranstaltungen"
          Icon={CelebrationRoundedIcon}
        />
        <LinkItem
          text="Zeiterfassung"
          href="/admin/reports"
          Icon={ScheduleIcon}
        />
        <LinkItem
          href="/admin/users"
          text="Personalverwaltung"
          Icon={ManageAccountsIcon}
        />
        <LinkItem
          href="/admin/requests"
          text="Mitarbeiter Anfragen"
          Icon={BackHandIcon}
        />
      </Grid>
    </div>
  );
}

function LinkItem({
  href,
  text,
  Icon,
}: {
  href: string;
  text: string;
  Icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="w-full bg-gray-100 rounded-md shadow flex gap-3 items-center px-4 py-5 text-xl text-gray-900"
    >
      <Icon fontSize="large" />
      <p>{text}</p>
    </Link>
  );
}
