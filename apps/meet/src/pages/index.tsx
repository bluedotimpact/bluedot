import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ErrorSection } from '@bluedot/ui';
import { Page } from '../components/Page';
import SelectPersonView from '../components/SelectPersonView';
import { type PageState } from '../lib/client/pageState';
import AppJoinView from '../components/AppJoinView';

const Home: React.FC = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId')
    // Legacy params names for backwards compatibility
    ?? searchParams.get('cohortId') ?? '';
  // TODO: use this to skip first page? or at least somehow highlight?
  // const participantId = searchParams.get('participantId') ?? undefined;

  const [page, setPage] = useState<PageState>({ name: 'select', groupId });

  if (!groupId) {
    return (
      <Page>
        <ErrorSection error={new Error('Missing group id. Check you\'ve navigated to the correct link.')} />
      </Page>
    );
  }

  const pageName = page.name;
  switch (pageName) {
    case 'select':
      return <SelectPersonView page={{ ...page, groupId }} setPage={setPage} />;
    case 'appJoin':
      return <AppJoinView page={page} />;
  }
};

export default Home;
