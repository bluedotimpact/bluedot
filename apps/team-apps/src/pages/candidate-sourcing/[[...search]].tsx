import { useCallback, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CandidateWorkbench } from '../../features/candidate-sourcing/Workbench';
import { candidatePath, createCandidateApi } from '../../features/candidate-sourcing/api';
import type { NavigationState } from '../../features/candidate-sourcing/types';
import { useNavigationState } from '../../lib/client/navigation';

const CandidateSearch = ({ searchId }: { searchId: string }) => {
  const router = useRouter();
  const api = useMemo(() => createCandidateApi(searchId), [searchId]);
  const onNavigate = useCallback((url: string) => {
    void router.push(candidatePath(url));
  }, [router]);
  const onNavigationStateChange = useCallback((state: NavigationState) => {
    useNavigationState.setState({ candidatePendingWrites: state.pendingWrites, unsavedChanges: state.unsavedChanges });
  }, []);
  useEffect(() => () => {
    useNavigationState.setState({ candidatePendingWrites: 0, unsavedChanges: false });
  }, []);
  return <CandidateWorkbench api={api} onNavigate={onNavigate} onNavigationStateChange={onNavigationStateChange} />;
};

const CandidateSourcing = () => {
  const router = useRouter();
  if (!router.isReady) return null;
  const segments = router.query.search;
  const searchId = Array.isArray(segments) ? segments[0] ?? '' : '';
  if ((Array.isArray(segments) && segments.length > 1) || !/^[a-zA-Z0-9_-]*$/.test(searchId)) return <p className="p-8 text-error-fg">This search address is invalid. Open Candidate sourcing from the sidebar.</p>;
  return <div className="[--candidate-viewport-height:calc(100dvh-64px)] md:[--candidate-viewport-height:100dvh]">
    <Head><title>Candidate sourcing · BlueDot Apps</title></Head>
    <CandidateSearch key={searchId} searchId={searchId} />
  </div>;
};

export default CandidateSourcing;
