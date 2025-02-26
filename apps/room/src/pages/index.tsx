import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  asError, CardButton, H1, P, withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { Room } from '../lib/types';
import { RoomHealthIndicator } from '../components/RoomHealthIndicator';

const POLL_INTERVAL = 5000; // 5 seconds

const DashboardPage = withAuth(({ auth }) => {
  const router = useRouter();
  const [{ data: rooms, loading, error }, poll] = useAxios<Room[]>({
    method: 'get',
    url: '/api/user/rooms',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  useEffect(() => {
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // If there's only one room, automatically select it
  useEffect(() => {
    if (rooms?.length === 1) {
      router.push(`/${rooms[0]!.id}`);
    }
  }, [rooms, router]);

  if (loading && !rooms) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <H1>Rooms</H1>
          <div className="animate-pulse grid gap-6 md:grid-cols-2">
            <div className="h-20 bg-stone-200 rounded" />
            <div className="h-20 bg-stone-200 rounded" />
            <div className="h-20 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !rooms) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <H1 className="text-red-600">Error</H1>
          <P className="text-red-700">{asError(error || 'Missing room data').message}</P>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <H1>Rooms</H1>

        <div className="grid gap-6 md:grid-cols-2">
          {rooms.map((room) => (
            <CardButton
              key={room.id}
              onPress={() => router.push(`/${room.id}`)}
              className="!py-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{room.name}</h2>
                <RoomHealthIndicator status={room.status} />
              </div>
            </CardButton>
          ))}
        </div>
      </div>
    </div>
  );
});

export default DashboardPage;
