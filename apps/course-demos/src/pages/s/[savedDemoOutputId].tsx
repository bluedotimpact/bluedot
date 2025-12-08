import React from 'react';
import { useRouter } from 'next/router';
import {
  H2, P, A, ProgressDots, asError,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { SavedDemoOutput } from '../api/saved-output/[savedDemoOutputId]';
import { GenerateReactComponentSavedDemoOutputViewer } from '../generate-react-component';

const ContentViewer: React.FC<{ savedDemoOutput: SavedDemoOutput, courseLink: string }> = ({ savedDemoOutput, courseLink }) => {
  const { type } = savedDemoOutput;

  try {
    switch (type) {
      case 'generate-react-component': {
        return (
          <GenerateReactComponentSavedDemoOutputViewer
            savedDemoOutput={savedDemoOutput}
            courseLink={courseLink}
          />
        );
      }
      default: {
        throw new Error(`Unrecognised demo type: ${type}`);
      }
    }
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error rendering demo', error);

    return (
      <>
        <H2 className="text-red-500">Couldn't interpret your demo</H2>
        <P>This can sometimes happen if the link is invalid or the content has been deleted.</P>
        <P>Using the demos yourself is often more fun anyway - you can find them all in our free <A href={courseLink}>Future of AI Course</A>.</P>
        <P>Details: {asError(error).message}</P>
      </>
    );
  }
};

const SharePage: React.FC = () => {
  const router = useRouter();
  const savedDemoOutputId = typeof router.query.savedDemoOutputId === 'string' ? router.query.savedDemoOutputId : null;
  const referralToken = typeof router.query.r === 'string' ? router.query.r : null;

  const [{ data: savedDemoOutput, loading, error }] = useAxios<SavedDemoOutput>({
    url: savedDemoOutputId ? `/api/saved-output/${savedDemoOutputId}` : undefined,
    method: 'get',
  });

  const courseLink = `https://bluedot.org/courses/future-of-ai?utm_source=demo&utm_campaign=${savedDemoOutput ? encodeURIComponent(savedDemoOutput.type) : 'unknown'}${referralToken ? `&r=${referralToken}` : ''}`;

  if (loading || !savedDemoOutputId) {
    return (
      <main className="mx-auto px-4 py-8">
        <P className="text-center">Loading shared content...</P>
        <ProgressDots />
      </main>
    );
  }

  if (error || !savedDemoOutput) {
    return (
      <main className="mx-auto px-4 py-8">
        <H2 className="text-red-500">Couldn't find your demo</H2>
        <P>This can sometimes happen if the link is invalid or the content has been deleted.</P>
        <P>Using the demos yourself is often more fun anyway - you can find them all in our free <A href={courseLink}>Future of AI Course</A>.</P>
        <P>Details: {error?.message || 'Failed to load shared content'}</P>
      </main>
    );
  }

  return (
    <main className="mx-auto p-4">
      <ContentViewer savedDemoOutput={savedDemoOutput} courseLink={courseLink} />
    </main>
  );
};

export default SharePage;
