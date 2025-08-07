import { Session } from '@/hooks/useSession';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useEffect, useState } from 'react';
import { ApiGetUsersResponse } from '../api/users';
import axios from 'axios';
import BackendBackButton from '@/components/backendBackButton';
import AdminUserCard from '@/components/admin/userCard';
import { ApiGetInvitesResponse } from '../api/invites';
import { Divider } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NewInviteDialog from '@/components/dialogs/newInviteDialog';
import AdminInviteCard from '@/components/admin/inviteCard';

export default function AdminUsersPage({ session }: { session: Session }) {
  useAuthGuard(session, 'ADMIN');
  const [users, setUsers] = useState<ApiGetUsersResponse>([]);
  const [invites, setInvites] = useState<ApiGetInvitesResponse>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const userSortingFn = (
    a: ApiGetUsersResponse[number],
    b: ApiGetUsersResponse[number]
  ) => {
    // 1. ADMINs zuerst
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;

    // 2. Wenn gleiche Rolle: nach Name sortieren
    return a.name.localeCompare(b.name);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get<ApiGetUsersResponse>('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchInvites = async () => {
    try {
      const { data } = await axios.get<ApiGetInvitesResponse>('/api/invites');
      setInvites(data);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      await Promise.all([fetchUsers(), fetchInvites()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 my-5">
      <div>
        <BackendBackButton />
        <h2 className="text-2xl text-center font-light font-cocogoose">
          Benutzerverwaltung
        </h2>
      </div>
      <button
        className="w-full bg-white rounded text-black font-bold px-3 py-3 mt-5 hover:bg-gray-200 transition-colors flex items-center gap-2 justify-center"
        onClick={() => setInviteDialogOpen(true)}
      >
        <PersonAddIcon />
        User einladen
      </button>

      <NewInviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onCreate={(invite) => setInvites((prev) => [...prev, invite])}
      />

      {loading ? (
        <p className="text-center text-gray-500 mt-8">Lade Benutzer...</p>
      ) : (
        <>
          <div className="mt-8">
            {users.length > 0 ? (
              <ul className="space-y-3">
                {users.sort(userSortingFn).map((user) => (
                  <AdminUserCard
                    key={user.id}
                    user={user}
                    onUpdate={(usr) =>
                      setUsers((prev) =>
                        prev.map((p) => (p.id == usr.id ? usr : p))
                      )
                    }
                    onDeactivate={() =>
                      setUsers((prev) => prev.filter((p) => p.id !== user.id))
                    }
                  />
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">
                Keine Benutzer gefunden
              </p>
            )}
          </div>
          {invites.length > 0 && (
            <>
              <Divider sx={{ my: 3 }}>Ausstehende Einladungen</Divider>
              <div className="flex flex-col gap-5">
                {invites.map((invite) => (
                  <AdminInviteCard
                    key={invite.id}
                    invite={invite}
                    onDelete={(id) =>
                      setInvites((prev) => prev.filter((p) => p.id !== id))
                    }
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
