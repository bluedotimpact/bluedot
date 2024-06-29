import useAxios from 'axios-hooks';
import { useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { Button, Input, Link } from '@bluedot/ui';
import { PageState } from '../lib/client/pageState';
import { MeetingParticipantsRequest, MeetingParticipantsResponse } from '../pages/api/public/meeting-participants';
import useJoinAs from '../lib/client/useJoinAs';
import { Page } from './Page';
import { H1 } from './Text';
import { RecordAttendanceRequest, RecordAttendanceResponse } from '../pages/api/public/record-attendance';

export type SelectPersonViewProps = {
  page: PageState & { name: 'select' },
  setPage: (page: PageState) => void,
};

const LOCALSTORAGE_ZOOM_APP_PREFERENCE_KEY = 'preference_joinWithZoomApp';

const SelectPersonView: React.FC<SelectPersonViewProps> = ({ page: { cohortId }, setPage }) => {
  const [{ data, loading, error }] = useAxios<MeetingParticipantsResponse, MeetingParticipantsRequest>({
    method: 'post',
    url: '/api/public/meeting-participants',
    data: { cohortId },
  });

  const { joinAs, isJoining, joinError } = useJoinAs({
    cohortClassId: data?.type === 'success' ? data.cohortClassId : '',
    setPage,
  });

  const [joinWithApp, _setJoinWithApp] = useState(
    JSON.parse(localStorage.getItem(LOCALSTORAGE_ZOOM_APP_PREFERENCE_KEY) ?? 'true'),
  );
  const setJoinWithApp = (value: boolean) => {
    localStorage.setItem(LOCALSTORAGE_ZOOM_APP_PREFERENCE_KEY, JSON.stringify(value));
    _setJoinWithApp(value);
  };

  const [showTimeWarning, setShowTimeWarning] = useState(false);

  const minuteDifferenceAllowed = 10;
  const checkSessionTime = () => {
    if (data?.type !== 'success') return false;

    const currentTime = Date.now() / 1000;
    const timeDifference = Math.abs(currentTime - data.cohortClassTime);
    const minutesDifference = Math.floor(timeDifference / 60);

    return minutesDifference > minuteDifferenceAllowed; // Return true if more than 10 minutes away from session time
  };

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
        <p>If this error persists, please contact us at software@bluedot.org.</p>
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
      {showTimeWarning ? (
        <div className="mb-4">
          <p>
            Kindly note that this is not the right time to join the session. Please make sure to join just {minuteDifferenceAllowed} minutes before the session begins.
          </p>
          <Button className="ml-4" onPress={() => setShowTimeWarning(false)}>Dismiss</Button>
        </div>
      ) : (
        <div className="flex">
          <H1 className="flex-1">Hey there! Who are you?</H1>
        </div>
      )}
      {joinError && <p className="mb-2">Error: {joinError}</p>}
      {isJoining ? <p>Joining meeting...</p> : !showTimeWarning && (
        <>
          <div className="grid gap-2 sm:w-1/2">
            {data.participants.map((participant) => (
              <Button
                key={participant.id}
                onPress={async () => {
                  if (checkSessionTime()) {
                    setShowTimeWarning(true);
                    return;
                  }
                  if (joinWithApp) {
                    await axios<RecordAttendanceResponse, AxiosResponse<MeetingParticipantsResponse>, RecordAttendanceRequest>({
                      method: 'POST',
                      url: '/api/public/record-attendance',
                      data: { cohortClassId: data.cohortClassId, participantId: participant.id },
                    });
                    setPage({
                      name: 'appJoin',
                      meetingNumber: data.meetingNumber,
                      meetingPassword: data.meetingPassword,
                      meetingHostKey: participant.role === 'host' ? data.meetingHostKey : undefined,
                    });
                    return;
                  }

                  await joinAs({ name: participant.name, participantId: participant.id });
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
                if (joinWithApp) {
                  setPage({
                    name: 'appJoin',
                    meetingNumber: data.meetingNumber,
                    meetingPassword: data.meetingPassword,
                    meetingHostKey: data.meetingHostKey,
                  });
                  return;
                }

                setPage({ name: 'custom', cohortClassId: data.cohortClassId });
              }}
              className="underline"
            >
              Enter your name manually.
            </Link>
          </div>
          <div className="mt-4">
            <label><Input type="checkbox" checked={joinWithApp} onChange={(event) => setJoinWithApp(event.target.checked)} /> Join with the Zoom app</label>
          </div>
        </>
      )}
    </Page>
  );
};

export default SelectPersonView;
