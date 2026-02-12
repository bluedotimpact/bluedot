import { type Room } from '../types';

// Simple, but good enough, in-memory "database"
export const rooms: Room[] = [
  {
    id: 'tv',
    name: 'BlueDot TV',
    status: {
      currentUrl: 'https://room.bluedot.org/display/tv',
      lastHeartbeatAt: 0,
      lastUpdatedAt: 0,
    },
  },
];
