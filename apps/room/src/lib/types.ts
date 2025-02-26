import { z } from 'zod';

export const RoomStatusSchema = z.object({
  currentUrl: z.string(),
  lastHeartbeatAt: z.number(),
  lastUpdatedAt: z.number(),
});
export type RoomStatus = z.infer<typeof RoomStatusSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: RoomStatusSchema,
});
export type Room = z.infer<typeof RoomSchema>;
