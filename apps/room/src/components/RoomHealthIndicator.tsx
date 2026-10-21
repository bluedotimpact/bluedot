import clsx from 'clsx';
import { type RoomStatus } from '../lib/types';

// Have received a heartbeat in the last 15 seconds
export const isRoomHealthy = (status: RoomStatus): boolean => (Date.now() / 1000) - status.lastHeartbeatAt < 15;

export const RoomHealthIndicator: React.FC<{ status: RoomStatus }> = ({ status }) => {
  const isHealthy = isRoomHealthy(status);

  return (
    <div className={clsx('px-3 py-1 rounded-full border text-sm font-medium', isHealthy ? 'border-success-border bg-success-bg text-success-fg' : 'border-error-border bg-error-bg text-error-fg')}>
      {isHealthy ? `Online (seen ${new Date(status.lastHeartbeatAt * 1000).toLocaleTimeString()})` : 'Offline'}
    </div>
  );
};
