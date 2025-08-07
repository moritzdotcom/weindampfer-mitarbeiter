import { Avatar, Divider } from '@mui/material';
import { ApiGetReportsResponse } from '@/pages/api/reports';
import { calculateMinutesWorked } from '@/lib/shift';
import { fullEventName } from '@/lib/event';

type Registration = ApiGetReportsResponse[number]['registrations'][number];

export default function AdminUserReportCard({
  user,
}: {
  user: ApiGetReportsResponse[number];
}) {
  const totalMinutesWorked = user.registrations.reduce(
    (sum, r) => sum + (calculateMinutesWorked(r.shift) || 0),
    0
  );

  const registrationSortFn = (a: Registration, b: Registration) => {
    return new Date(a.event.date).getTime() - new Date(b.event.date).getTime();
  };

  return (
    <div
      className={`bg-neutral-800 text-white rounded-2xl p-4 shadow-md border ${
        user.role === 'ADMIN' ? 'border-yellow-500' : 'border-neutral-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* MUI Avatar mit Bild oder Initialen */}
          <Avatar
            src={user.image || undefined}
            alt={user.name}
            sx={{
              width: 48,
              height: 48,
              fontSize: 20,
              bgcolor: '#333',
              color: '#fff',
            }}
          >
            {user.name?.[0]?.toUpperCase() || '👤'}
          </Avatar>

          <div>
            <h3 className="text-base font-semibold">
              {user.role === 'ADMIN' && '👑 '}
              {user.name}
            </h3>
          </div>
        </div>

        <div className="text-center">
          <h6 className="text-lg sm:text-2xl font-semibold">
            {(totalMinutesWorked / 60).toFixed(1)} Std.
          </h6>
          <p className="text-sm sm:text-base">gearbeitet</p>
        </div>
      </div>
      <div className="mt-5">
        {user.registrations.sort(registrationSortFn).map((r) => {
          return (
            <div
              key={r.id}
              className="border-t border-gray-400 flex items-center justify-between px-1 py-2"
            >
              <p>{r.event.name}</p>
              <p>
                {((calculateMinutesWorked(r.shift) || 0) / 60).toFixed(1)} Std.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
