import { useSearchParams } from 'next/navigation';
import useAxios from 'axios-hooks';
import { useState } from 'react';
import { Button, Input } from '@bluedot/ui';
import { Page } from '../components/Page';
import { H1 } from '../components/Text';
import { RecordAttendanceRequest, RecordAttendanceResponse } from './api/public/record-attendance';

const RecordAttendance: React.FC = () => {
  const searchParams = useSearchParams();
  const cohortClassId = searchParams.get('groupClassId') ?? '';
  const participantId = searchParams.get('participantId') ?? '';

  if (!cohortClassId || !participantId) {
    return (
      <Page>
        <H1 className="flex-1">Error: Missing cohort class or participant id.</H1>
        <p className="mb-2">Ensure you've navigated to the correct link, or try asking the person who gave the link to check it's correct.</p>
        <p>If you're still having difficulties, drop us a line at team@bluedot.org.</p>
      </Page>
    );
  }

  return <RecordAttendancePage cohortClassId={cohortClassId} participantId={participantId} />;
};

const RecordAttendancePage: React.FC<{ cohortClassId: string, participantId: string }> = ({ cohortClassId, participantId }) => {
  const [{ data, loading }, _recordAttendance] = useAxios<RecordAttendanceResponse, RecordAttendanceRequest>({
    method: 'post',
    url: '/api/public/record-attendance',
    data: { cohortClassId, participantId },
  }, { manual: true });
  const recordAttendance = ({ reason }: { reason: string }) => _recordAttendance({
    data: { cohortClassId, participantId, reason },
  });

  const [otherReason, setOtherReason] = useState('');

  if (loading) {
    return (
      <Page>
        <H1 className="flex-1">Updating attendance...</H1>
      </Page>
    );
  }

  if (data) {
    return (
      <Page>
        <H1 className="flex-1">Thanks for marking your attendance!</H1>
      </Page>
    );
  }

  return (
    <Page>
      <H1 className="flex-1">Manual attendance update</H1>
      <p className="mb-2">Why do you need to update your attendance?</p>
      <div className="grid gap-2 md:w-1/2">
        {['Used native Zoom app', 'Used direct Zoom link in browser', 'Joined with wrong name', 'Joined with a custom name', 'Not sure, but I attended'].map((reason) => <Button onPress={() => recordAttendance({ reason })}>{reason}</Button>)}
      </div>

      <div className="mt-4 flex gap-2 md:w-1/2">
        <label className="flex items-center flex-1">Other:
          <Input type="text" value={otherReason} onChange={(value) => setOtherReason(value.target.value)} className="ml-2 w-full" />
        </label>
        <Button onPress={() => recordAttendance({ reason: otherReason })} disabled={!otherReason.length}>Submit</Button>
      </div>
    </Page>
  );
};

export default RecordAttendance;
