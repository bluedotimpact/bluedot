import React from 'react';
import { useRouter } from 'next/router';
import {
  LegacyText, Link, ProgressDots, asError,
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
        <LegacyText.H2 className="text-red-500">Couldn't interpret your demo</LegacyText.H2>
        <LegacyText.P>This can sometimes happen if the link is invalid or the content has been deleted.</LegacyText.P>
        <LegacyText.P>Using the demos yourself is often more fun anyway - you can find them all in our free <Link url={courseLink}>Future of AI Course</Link>.</LegacyText.P>
        <LegacyText.P>Details: {asError(error).message}</LegacyText.P>
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
        <LegacyText.P className="text-center">Loading shared content...</LegacyText.P>
        <ProgressDots />
      </main>
    );
  }

  if (error || !savedDemoOutput) {
    return (
      <main className="mx-auto px-4 py-8">
        <LegacyText.H2 className="text-red-500">Couldn't find your demo</LegacyText.H2>
        <LegacyText.P>This can sometimes happen if the link is invalid or the content has been deleted.</LegacyText.P>
        <LegacyText.P>Using the demos yourself is often more fun anyway - you can find them all in our free <Link url={courseLink}>Future of AI Course</Link>.</LegacyText.P>
        <LegacyText.P>Details: {error?.message || 'Failed to load shared content'}</LegacyText.P>
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
