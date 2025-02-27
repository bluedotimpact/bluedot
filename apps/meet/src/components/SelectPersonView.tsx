import useAxios from 'axios-hooks';
import axios, { AxiosResponse } from 'axios';
import { Button, Link } from '@bluedot/ui';
import { PageState } from '../lib/client/pageState';
import { MeetingParticipantsRequest, MeetingParticipantsResponse } from '../pages/api/public/meeting-participants';
import { Page } from './Page';
import { H1 } from './Text';
import { RecordAttendanceRequest, RecordAttendanceResponse } from '../pages/api/public/record-attendance';

export type SelectPersonViewProps = {
  page: PageState & { name: 'select' },
  setPage: (page: PageState) => void,
};

const SelectPersonView: React.FC<SelectPersonViewProps> = ({ page: { groupId }, setPage }) => {
  const [{ data, loading, error }] = useAxios<MeetingParticipantsResponse, MeetingParticipantsRequest>({
    method: 'post',
    url: '/api/public/meeting-participants',
    data: { groupId },
  });

  if (loading) {
    return (
      <Page>
        <H1 className="flex-1">Loading...</H1>
      </Page>
    );
  }

  const errorMessage = error?.response?.data?.type === 'error' ? error.response.data.message : error?.message;
  if (errorMessage || !data || data.type === 'error') {
    return (
      <Page>
        <H1 className="flex-1">Error: {errorMessage ?? 'Unknown error'}</H1>
        <p>If this error persists, please contact us at team@bluedot.org.</p>
      </Page>
    );
  }

  if (data.type === 'redirect') {
    window.location.href = data.to;
    return (
      <Page>
        <H1 className="flex-1">Redirecting...</H1>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex">
        <H1 className="flex-1">Hey there! Who are you?</H1>
      </div>
      {(data.meetingStartTime > (Date.now() / 1000) + 10 * 60)
          && (
            <div className="alert -mx-2 mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-300 border-solid ">
              <p className="font-bold mb-1">Heads up, you're a little early.</p>
              <p>Your next discussion is scheduled to start at {new Date(data.meetingStartTime * 1000).toLocaleString()}.</p>
            </div>
          )}
      {(data.meetingEndTime + 10 * 60 < (Date.now() / 1000))
          && (
            <div className="alert -mx-2 mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-300 border-solid">
              <p className="font-bold mb-1">Heads up, your discussion has passed its scheduled end time.</p>
              <p>Your discussion ended at {new Date(data.meetingEndTime * 1000).toLocaleString()}.</p>
            </div>
          )}
      <div className="grid gap-2 sm:w-1/2">
        {data.participants.map((participant) => (
          <Button
            key={participant.id}
            onPress={async () => {
              await axios<RecordAttendanceResponse, AxiosResponse<MeetingParticipantsResponse>, RecordAttendanceRequest>({
                method: 'POST',
                url: '/api/public/record-attendance',
                data: { groupDiscussionId: data.groupDiscussionId, participantId: participant.id },
              });
              setPage({
                name: 'appJoin',
                meetingNumber: data.meetingNumber,
                meetingPassword: data.meetingPassword,
                meetingHostKey: participant.role === 'host' ? data.meetingHostKey : undefined,
              });
            }}
          >
            {participant.name}
          </Button>
        ))}
      </div>
      <div className="mt-4">
        Not on this list?
        {' '}
        <Link
          onPress={() => {
            setPage({
              name: 'appJoin',
              meetingNumber: data.meetingNumber,
              meetingPassword: data.meetingPassword,
              meetingHostKey: data.meetingHostKey,
            });
          }}
          className="underline"
        >
          Join without registering attendance.
        </Link>
      </div>
    </Page>
  );
};

export default SelectPersonView;
