import { Session } from '@/hooks/useSession';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BackendBackButton from '@/components/backendBackButton';
import { ApiGetReportsResponse } from '../api/reports';
import AdminUserReportCard from '@/components/admin/reportCard';
import { Button, MenuItem, TextField } from '@mui/material';

export default function AdminReportsPage({ session }: { session: Session }) {
  useAuthGuard(session, 'ADMIN');
  const [users, setUsers] = useState<ApiGetReportsResponse>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const userSortingFn = (
    a: ApiGetReportsResponse[number],
    b: ApiGetReportsResponse[number],
  ) => {
    // 1. ADMINs zuerst
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;

    // 2. Wenn gleiche Rolle: nach Name sortieren
    return a.name.localeCompare(b.name);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<ApiGetReportsResponse>('/api/reports', {
        params: { year, month },
      });
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  async function downloadTimesheets(year: number, month0based: number) {
    const res = await fetch(
      `/api/reports/timesheetsZip?year=${year}&month=${month0based}`,
    );
    if (!res.ok) throw new Error('Download failed');

    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Stundenzettel_${year}_${String(month0based + 1).padStart(2, '0')}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  useEffect(() => {
    fetchUsers();
  }, [month, year]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 my-5">
      <div>
        <BackendBackButton />
        <h2 className="text-2xl text-center font-light font-cocogoose">
          Zeiterfassung
        </h2>
        <div className="flex items-center gap-6 mt-4">
          <TextField
            select
            fullWidth
            variant="standard"
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
            }}
          >
            <MenuItem value={0}>Januar</MenuItem>
            <MenuItem value={1}>Februar</MenuItem>
            <MenuItem value={2}>März</MenuItem>
            <MenuItem value={3}>April</MenuItem>
            <MenuItem value={4}>Mai</MenuItem>
            <MenuItem value={5}>Juni</MenuItem>
            <MenuItem value={6}>Juli</MenuItem>
            <MenuItem value={7}>August</MenuItem>
            <MenuItem value={8}>September</MenuItem>
            <MenuItem value={9}>Oktober</MenuItem>
            <MenuItem value={10}>November</MenuItem>
            <MenuItem value={11}>Dezember</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            variant="standard"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
            }}
          >
            {Array.from({
              length:
                new Date().getFullYear() -
                new Date('2025-01-01').getFullYear() +
                1,
            }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              );
            })}
          </TextField>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-8">Lade Benutzer...</p>
      ) : (
        <>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => downloadTimesheets(year, month)}
            sx={{ mt: 3 }}
          >
            Stundenzettel herunterladen
          </Button>
          <div className="mt-8">
            {users.length > 0 ? (
              <ul className="space-y-3">
                {users.sort(userSortingFn).map((user) => (
                  <AdminUserReportCard key={user.id} user={user} />
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">
                Keine Benutzer gefunden
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
