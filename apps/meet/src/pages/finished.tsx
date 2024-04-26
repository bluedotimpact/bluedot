import { useSearchParams } from 'next/navigation';
import useAxios from 'axios-hooks';
import { Button } from '@bluedot/ui';
import { Page } from '../components/Page';
import { H1 } from '../components/Text';
import { CohortCourseHubLinkRequest, CohortCourseHubLinkResponse } from './api/public/cohort-course-hub-link';

const Finished: React.FC = () => {
  const searchParams = useSearchParams();
  const cohortId = searchParams.get('cohortId') ?? '';

  if (!cohortId) {
    return (
      <Page>
        <H1 className="flex-1">Thanks for attending!</H1>
      </Page>
    );
  }

  return <FinishedPage cohortId={cohortId} />;
};

const FinishedPage: React.FC<{ cohortId: string }> = ({ cohortId }) => {
  const [{ data }] = useAxios<CohortCourseHubLinkResponse, CohortCourseHubLinkRequest>({
    method: 'post',
    url: '/api/public/cohort-course-hub-link',
    data: { cohortId },
  });

  return (
    <Page>
      <H1 className="flex-1">Thanks for attending!</H1>
      <div className="flex flex-row gap-2">
        <Button href={`/${window.location.search}`}>Rejoin the meeting</Button>
        {data?.type === 'success' ? <Button href={data.url}>Return to Course Hub</Button> : null}
      </div>
    </Page>
  );
};

export default Finished;
