import { useSearchParams } from 'next/navigation';
import useAxios from 'axios-hooks';
import { useState } from 'react';
import {
  CTALinkOrButton, ErrorSection, Input, H1,
} from '@bluedot/ui';
import { Page } from '../components/Page';
import { RecordAttendanceRequest, RecordAttendanceResponse } from './api/public/record-attendance';

const RecordAttendance: React.FC = () => {
  const searchParams = useSearchParams();
  const groupDiscussionId = searchParams.get('groupDiscussionId')
    // Legacy params names for backwards compatibility
    ?? searchParams.get('groupClassId') ?? searchParams.get('cohortClassId') ?? '';
  const participantId = searchParams.get('participantId') ?? '';

  if (!groupDiscussionId || !participantId) {
    return (
      <Page>
        <ErrorSection error={new Error('Missing group discussion or participant id. Check you\'ve navigated to the correct link.')} />
      </Page>
    );
  }

  return <RecordAttendancePage groupDiscussionId={groupDiscussionId} participantId={participantId} />;
};

const RecordAttendancePage: React.FC<{ groupDiscussionId: string, participantId: string }> = ({ groupDiscussionId, participantId }) => {
  const [{ data, loading }, _recordAttendance] = useAxios<RecordAttendanceResponse, RecordAttendanceRequest>({
    method: 'post',
    url: '/api/public/record-attendance',
    data: { groupDiscussionId, participantId },
  }, { manual: true });
  const recordAttendance = ({ reason }: { reason: string }) => _recordAttendance({
    data: { groupDiscussionId, participantId, reason },
  });

  const [otherReason, setOtherReason] = useState('');

  if (loading) {
    return (
      <Page>
        <H1>Updating attendance...</H1>
      </Page>
    );
  }

  if (data) {
    return (
      <Page>
        <H1>Thanks for marking your attendance!</H1>
      </Page>
    );
  }

  return (
    <Page>
      <H1 className="mb-4">Manual attendance update</H1>
      <p className="mb-2">Why do you need to update your attendance?</p>
      <div className="grid gap-2 md:w-1/2">
        {[
          'Used native Zoom app',
          'Used direct Zoom link in browser',
          'Joined with wrong name',
          'Joined with a custom name',
          'Not sure, but I attended',
        ].map((reason) => (
          <CTALinkOrButton
            variant="secondary"
            url="test"
            onClick={() => recordAttendance({ reason })}
          >
            {reason}
          </CTALinkOrButton>
        ))}
      </div>

      <div className="mt-4 flex gap-2 md:w-1/2">
        <label className="flex items-center flex-1">Other:
          <Input type="text" value={otherReason} onChange={(value) => setOtherReason(value.target.value)} className="ml-2 w-full" />
        </label>
        <CTALinkOrButton variant="secondary" onClick={() => recordAttendance({ reason: otherReason })} disabled={!otherReason.length}>Submit</CTALinkOrButton>
      </div>
    </Page>
  );
};

export default RecordAttendance;
