import Link from 'next/link';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

export default function BackendBackButton({ href }: { href?: string }) {
  return (
    <div className="mb-5">
      <Link
        className="text-white text-lg py-2 inline-flex items-center"
        href={href || '/admin'}
        title="Zurück zur Admin-Seite"
      >
        <ArrowBackIosIcon fontSize="inherit" />
        Zurück
      </Link>
    </div>
  );
}
