import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  asError, Button, LegacyText, Input, withAuth, Link,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { FaPlus, FaLink } from 'react-icons/fa6';
import { Room } from '../lib/types';
import { isRoomHealthy, RoomHealthIndicator } from '../components/RoomHealthIndicator';

const POLL_INTERVAL = 5000; // 5 seconds

const RoomControlPage = withAuth(({ auth }) => {
  const { roomId } = useRouter().query;
  const [{ data: room, loading, error }, poll] = useAxios<Room>({
    method: 'get',
    url: `/api/user/rooms/${roomId}`,
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  useEffect(() => {
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
    };
  }, [roomId]);

  const [meetingInputValue, setMeetingInputValue] = useState('');

  if (!room && loading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="container-lined p-8 my-4">
            <div className="animate-pulse">
              <div className="h-8 bg-stone-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-stone-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-stone-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <LegacyText.H1 className="text-red-600">Error</LegacyText.H1>
          <LegacyText.P className="text-red-700">{asError(error || 'Missing room data').message}</LegacyText.P>
        </div>
      </div>
    );
  }

  const setPiCurrentUrl = async (url: string | null) => {
    await axios({
      method: 'PUT',
      url: `/api/user/rooms/${roomId}`,
      data: {
        currentUrl: url,
        lastUpdatedAt: Date.now() / 1000,
      },
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    await poll();
  };

  const meetingUrl = (() => {
    // If it's a Google meet code, return it
    // ex: 'wpf-drsq-yoc'
    const googleMeetCodeMatch = meetingInputValue.match(/^([a-z]{3})-?([a-z]{4})-?([a-z]{3})$/);
    if (googleMeetCodeMatch) {
      return `https://meet.google.com/${googleMeetCodeMatch[1]}-${googleMeetCodeMatch[2]}-${googleMeetCodeMatch[3]}`;
    }

    // If it's a plausible (with dot) valid URL, return it
    if (meetingInputValue.includes('.') && !meetingInputValue.endsWith('.')) {
      try {
        return new URL(meetingInputValue).href;
      } catch { /* ignore */ }

      // If it just needs a https:// prefix, return it
      const prefixed = `https://${meetingInputValue}`;
      try {
        return new URL(prefixed).href;
      } catch { /* ignore */ }
    }

    return null;
  })();

  const defaultDisplayUrl = `${window.location.origin}/display/${roomId}`;

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="container-lined p-8 my-4 space-y-4">
          <div className="flex items-center justify-between">
            <LegacyText.H2 className="!mt-0">{room.name}</LegacyText.H2>
            <div className="hidden sm:block">
              <RoomHealthIndicator status={room.status} />
            </div>
          </div>

          {isRoomHealthy(room.status) && (
            room.status.currentUrl === defaultDisplayUrl ? (
              <div className="grid md:grid-cols-[1fr_0_1fr] gap-4 md:gap-8 items-center">
                <div>
                  <Button onPress={() => setPiCurrentUrl('https://meet.google.com/landing?instantMeeting=true')}>
                    <div className="flex gap-1.5 items-center"><FaPlus /> Start instant meeting</div>
                  </Button>
                </div>
                <div className="flex md:flex-col gap-1.5 items-center h-full">
                  <div className="border-t md:border-l border-stone-500 flex-1" />
                  <div>OR</div>
                  <div className="border-t md:border-l border-stone-500 flex-1" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5 items-center"><FaLink /> Join existing meeting</div>
                  <div className="flex gap-1.5 items-center">
                    <Input
                      type="text"
                      value={meetingInputValue}
                      onChange={(e) => setMeetingInputValue(e.target.value)}
                      placeholder="Meeting code or URL"
                      className="flex-1"
                    />
                    <Button
                      onPress={() => setPiCurrentUrl(meetingUrl)}
                      disabled={!meetingUrl}
                      className="!self-center"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <LegacyText.P>Currently viewing <Link url={room.status.currentUrl} className="underline">{room.status.currentUrl}</Link></LegacyText.P>
                <Button onPress={() => setPiCurrentUrl(defaultDisplayUrl)}>
                  Leave {room.status.currentUrl.includes('meet') ? 'meeting' : 'page'}
                </Button>
              </div>
            )
          )}

          {!isRoomHealthy(room.status) && (
            <div>
              <LegacyText.P>This room is offline. {room.status.lastHeartbeatAt ? `It was last seen at ${new Date(room.status.lastHeartbeatAt * 1000).toLocaleString()}` : 'We have not seen it online recently'}.</LegacyText.P>
              <LegacyText.P>Make sure the meeting room device is turned on and has an internet connection.</LegacyText.P>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default RoomControlPage;
