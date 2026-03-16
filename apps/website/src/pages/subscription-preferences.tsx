import Head from 'next/head';
import { type GetServerSideProps } from 'next';
import { useState } from 'react';
import {
  CTALinkOrButton, ErrorSection, ProgressDots,
} from '@bluedot/ui';
import { H3, P } from '@bluedot/ui/src/Text';
import { ROUTES } from '../lib/routes';
import { trpc } from '../utils/trpc';
import type { SubscriptionTopic } from '../server/routers/subscription-preferences';

const CURRENT_ROUTE = ROUTES.subscriptionPreferences;

type SubscriptionPreferencesPageProps = {
  cid: string;
  token: string;
  topicId: number | null;
};

const SubscriptionPreferencesPage = ({ cid, token, topicId: highlightTopicId }: SubscriptionPreferencesPageProps) => {
  const { data, isLoading, error } = trpc.subscriptionPreferences.getPreferences.useQuery(
    { cid, token },
    { enabled: !!cid && !!token, retry: false },
  );

  if (isLoading) return <ProgressDots className="py-16" />;
  if (error) return <GenericError />;
  if (!data) return null;

  const sortedTopics = highlightTopicId
    ? [...data.topics].sort((a, b) => {
      if (a.id === highlightTopicId) return -1;
      if (b.id === highlightTopicId) return 1;
      return 0;
    })
    : data.topics;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="mx-auto px-4 py-12 max-w-lg">
        <img src="/images/logo/BlueDot_Impact_Logo.svg" alt="BlueDot Impact" className="h-8 mb-8" />
        <H3 className="mb-2">Email Preferences</H3>
        <P className="text-gray-500 mb-8">Choose which emails you&apos;d like to receive from BlueDot Impact.</P>
        <PreferencesForm cid={cid} token={token} topics={sortedTopics} highlightTopicId={highlightTopicId} />
      </div>
    </div>
  );
};

// Bypasses the site header, footer, and bluedot-base wrapper from _app.tsx
SubscriptionPreferencesPage.rawLayout = true;

// Intentionally vague — don't reveal whether the link or contact is the issue
const GenericError = () => (
  <div className="mx-auto px-4 py-12 max-w-lg">
    <ErrorSection error={new Error('This link is invalid or has expired. Please use the link from your email.')} />
  </div>
);

type PreferencesFormProps = {
  cid: string;
  token: string;
  topics: SubscriptionTopic[];
  highlightTopicId: number | null;
};

const PreferencesForm = ({
  cid, token, topics, highlightTopicId,
}: PreferencesFormProps) => {
  const [subscribed, setSubscribed] = useState<Record<number, boolean>>(Object.fromEntries(topics.map((t) => [t.id, t.subscribed])));
  const [saved, setSaved] = useState(false);

  const saveMutation = trpc.subscriptionPreferences.savePreferences.useMutation({
    onSuccess() {
      setSaved(true);
    },
  });

  const handleToggle = (topicId: number, value: boolean) => {
    setSaved(false);
    setSubscribed((prev) => ({ ...prev, [topicId]: value }));
  };

  const handleSave = () => {
    const preferences = Object.fromEntries(topics.map((t) => [`topic_${t.id}`, subscribed[t.id] ?? t.subscribed]));
    saveMutation.mutate({ cid, token, preferences });
  };

  return (
    <div className="space-y-5">
      {topics.map((topic) => {
        const isHighlighted = topic.id === highlightTopicId;
        return (
          <label
            key={topic.id}
            className={`flex items-start gap-3 cursor-pointer rounded-lg p-3 -mx-3 ${isHighlighted ? 'border border-bluedot-light' : ''}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-6 shrink-0 cursor-pointer accent-bluedot-normal"
              checked={subscribed[topic.id] ?? topic.subscribed}
              onChange={(e) => handleToggle(topic.id, e.target.checked)}
            />
            <div>
              <P className="font-semibold text-black leading-snug">{topic.name}</P>
              {topic.description && (
                <P className="text-gray-500 text-size-sm mt-0.5">{topic.description}</P>
              )}
            </div>
          </label>
        );
      })}

      <div className="pt-4 space-y-4">
        {saved && <P className="text-green-600 text-size-sm">Your preferences have been saved. It may take a few seconds for changes to appear if you revisit this page.</P>}
        {saveMutation.error && (
          <P className="text-red-600 text-size-sm">Failed to save. Please try again.</P>
        )}
        <CTALinkOrButton
          variant="primary"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save preferences'}
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<SubscriptionPreferencesPageProps> = async ({ query }) => {
  const cid = typeof query.cid === 'string' ? query.cid : null;
  const token = typeof query.token === 'string' ? query.token : null;

  if (!cid || !token) {
    return { notFound: true };
  }

  const rawTopicId = typeof query.topicId === 'string' ? Number(query.topicId) : null;
  const topicId = rawTopicId !== null && !Number.isNaN(rawTopicId) ? rawTopicId : null;

  return {
    props: { cid, token, topicId },
  };
};

export default SubscriptionPreferencesPage;
