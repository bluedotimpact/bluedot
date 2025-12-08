import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ClickTarget, ErrorSection, H1, withAuth,
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
  }, [poll]);

  // If there's only one room, automatically select it
  useEffect(() => {
    if (rooms?.length === 1) {
      router.push(`/${rooms[0]!.id}`);
    }
  }, [rooms, router]);

  if (loading && !rooms) {
    return (
      <div className="p-8">
        <div className="section-base">
          <H1 className="mb-4">Rooms</H1>
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
      <ErrorSection error={error || new Error('Failed to load rooms')} />
    );
  }

  return (
    <div className="py-8">
      <div className="section-base">
        <H1 className="mb-4">Rooms</H1>

        <div className="grid gap-6 md:grid-cols-2">
          {rooms.map((room) => (
            <ClickTarget onClick={() => router.push(`/${room.id}`)} className="container-lined cursor-pointer hover:bg-cream-dark focus:bg-cream-dark p-6 transition-all">
              <div className="flex items-center justify-between">
                <h2 className="text-size-lg font-semibold">{room.name}</h2>
                <RoomHealthIndicator status={room.status} />
              </div>
            </ClickTarget>
          ))}
        </div>
      </div>
    </div>
  );
});

export default DashboardPage;
