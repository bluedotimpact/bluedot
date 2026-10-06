import useAxios from 'axios-hooks';
import {
  Callout,
  ClickTarget,
  Button, ErrorSection, H1,
  ProgressDots,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { FaChevronRight } from 'react-icons/fa6';
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
  const [{ loading: recordingAttendance, error: recordAttendanceError }, recordAttendance] = useAxios<RecordAttendanceResponse, RecordAttendanceRequest>({
    method: 'post',
    url: '/api/public/record-attendance',
  }, { manual: true });

  if (loading) {
    return (
      <Page>
        <ProgressDots />
      </Page>
    );
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (error || !data) {
    return (
      <Page>
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        <ErrorSection error={error || new Error('Missing data from API')} />
      </Page>
    );
  }

  return (
    <Page>
      <H1 className="mb-4">Hey there! Who are you?</H1>
      {(data.meetingStartTime > (currentTimeMs / 1000) + 10 * 60)
      && (
        <Callout tone="warning" title="Heads up, you're a little early." className="my-4">
          Your next discussion is scheduled to start at {new Date(data.meetingStartTime * 1000).toLocaleString()}.
        </Callout>
      )}
      {(data.meetingEndTime + 10 * 60 < (currentTimeMs / 1000))
      && (
        <Callout tone="warning" title="Heads up, your discussion has passed its scheduled end time." className="my-4">
          Your discussion ended at {new Date(data.meetingEndTime * 1000).toLocaleString()}.
        </Callout>
      )}
      {data.activityDoc && (
        <Button
          className="mb-2"
          variant="primary"
          url={data.activityDoc}
          target="_blank"
        >
          Open Discussion Doc
        </Button>
      )}
      {recordAttendanceError && <ErrorSection error={recordAttendanceError} />}
      <div className="grid gap-2 sm:w-1/2">
        {data.participants.map((participant) => (
          <Button
            key={participant.id}
            variant="secondary"
            disabled={recordingAttendance}
            onClick={async () => {
              try {
                await recordAttendance({
                  data: { groupDiscussionId: data.groupDiscussionId, participantId: participant.id },
                });
              } catch {
                // Errors are handled above (at hook invocation)
                return;
              }

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
            <FaChevronRight aria-hidden className="size-4" />
          </Button>
        ))}
      </div>
      <div className="mt-4">
        Not on this list?
        {' '}
        <ClickTarget
          onClick={() => {
            // No host key here: for security-through-obscurity reasons, only show the key if the user clicks the facilitator's name
            setPage({
              name: 'appJoin',
              meetingNumber: data.meetingNumber,
              meetingPassword: data.meetingPassword,
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
