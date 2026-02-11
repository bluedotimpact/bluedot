import useAxios from 'axios-hooks';
import axios, { type AxiosResponse } from 'axios';
import {
  ClickTarget,
  CTALinkOrButton, ErrorSection, H1,
  ProgressDots,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { type PageState } from '../lib/client/pageState';
import { type MeetingParticipantsRequest, type MeetingParticipantsResponse } from '../pages/api/public/meeting-participants';
import { Page } from './Page';
import { type RecordAttendanceRequest, type RecordAttendanceResponse } from '../pages/api/public/record-attendance';

export type SelectPersonViewProps = {
  page: PageState & { name: 'select' };
  setPage: (page: PageState) => void;
};

const SelectPersonView: React.FC<SelectPersonViewProps> = ({ page: { groupId }, setPage }) => {
  const currentTimeMs = useCurrentTimeMs();
  const [{ data, loading, error }] = useAxios<MeetingParticipantsResponse, MeetingParticipantsRequest>({
    method: 'post',
    url: '/api/public/meeting-participants',
    data: { groupId },
  });

  if (loading) {
    return (
      <Page>
        <ProgressDots />
      </Page>
    );
  }

  if (error ?? !data) {
    return (
      <Page>
        <ErrorSection error={error ?? new Error('Missing data from API')} />
      </Page>
    );
  }

  return (
    <Page>
      <H1 className="mb-4">Hey there! Who are you?</H1>
      {(data.meetingStartTime > (currentTimeMs / 1000) + 10 * 60)
      && (
        <div className="alert -mx-2 my-4 p-4 bg-yellow-100 border-l-4 border-yellow-300 border-solid ">
          <p className="font-bold mb-1">Heads up, you're a little early.</p>
          <p>Your next discussion is scheduled to start at {new Date(data.meetingStartTime * 1000).toLocaleString()}.</p>
        </div>
      )}
      {(data.meetingEndTime + 10 * 60 < (currentTimeMs / 1000))
      && (
        <div className="alert -mx-2 my-4 p-4 bg-yellow-100 border-l-4 border-yellow-300 border-solid">
          <p className="font-bold mb-1">Heads up, your discussion has passed its scheduled end time.</p>
          <p>Your discussion ended at {new Date(data.meetingEndTime * 1000).toLocaleString()}.</p>
        </div>
      )}
      {data.activityDoc && (
        <CTALinkOrButton
          className="mb-2"
          variant="primary"
          url={data.activityDoc}
          target="_blank"
        >
          Open Discussion Doc
        </CTALinkOrButton>
      )}
      <div className="grid gap-2 sm:w-1/2">
        {data.participants.map((participant) => (
          <CTALinkOrButton
            key={participant.id}
            variant="secondary"
            withChevron
            onClick={async () => {
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
                activityDoc: data.activityDoc,
              });
            }}
          >
            {participant.name}
          </CTALinkOrButton>
        ))}
      </div>
      <div className="mt-4">
        Not on this list?
        {' '}
        <ClickTarget
          onClick={() => {
            setPage({
              name: 'appJoin',
              meetingNumber: data.meetingNumber,
              meetingPassword: data.meetingPassword,
              meetingHostKey: data.meetingHostKey,
              activityDoc: data.activityDoc,
            });
          }}
          className="underline cursor-pointer"
        >
          Join without registering attendance.
        </ClickTarget>
      </div>
    </Page>
  );
};

export default SelectPersonView;
