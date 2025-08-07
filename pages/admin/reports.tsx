import { Session } from '@/hooks/useSession';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BackendBackButton from '@/components/backendBackButton';
import { ApiGetReportsResponse } from '../api/reports';
import AdminUserReportCard from '@/components/admin/reportCard';

export default function AdminReportsPage({ session }: { session: Session }) {
  useAuthGuard(session, 'ADMIN');
  const [users, setUsers] = useState<ApiGetReportsResponse>([]);
  const [loading, setLoading] = useState(true);

  const userSortingFn = (
    a: ApiGetReportsResponse[number],
    b: ApiGetReportsResponse[number]
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
      const { data } = await axios.get<ApiGetReportsResponse>('/api/reports');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 my-5">
      <div>
        <BackendBackButton />
        <h2 className="text-2xl text-center font-light font-cocogoose">
          Zeiterfassung
        </h2>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-8">Lade Benutzer...</p>
      ) : (
        <>
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
