import Link from 'next/link';

export default function AdminHeader({ name }: { name: string }) {
  return (
    <div className="fixed top-0 w-full bg-neutral-800 z-50">
      <div className="max-w-4xl mx-auto px-4 py-1 flex items-center justify-between">
        <p className="font-bold">Hallo {name}!</p>
        <Link href="/backend" className="flex items-center gap-1 underline">
          Zur Admin Seite
        </Link>
      </div>
    </div>
  );
}
