import React, { useState } from 'react';
import {
  Button, LegacyText, Link, ProgressDots,
} from '@bluedot/ui';
import { useCompletion } from '@ai-sdk/react';
import { LinkOrButton } from '@bluedot/ui/src/legacy/LinkOrButton';
import { CodeRenderer } from '../components/CodeRenderer';
import { SavedDemoOutput } from './api/saved-output/[savedDemoOutputId]';
import { ShareSavedDemoButton } from '../components/ShareSavedDemoButton';

const DemoPage: React.FC = () => {
  const [view, setView] = useState<'prompt' | 'display'>('prompt');
  const [userPrompt, setUserPrompt] = useState('');

  const {
    completion: generatedCode, complete, isLoading: loading, error,
  } = useCompletion({
    api: '/api/generate-react-component',
    onResponse: () => {
      setView('display');
    },
  });

  const handleSubmit = async (submittedUserPrompt: string = userPrompt) => {
    if (submittedUserPrompt !== userPrompt) {
      setUserPrompt(submittedUserPrompt);
    }
    if (!submittedUserPrompt.trim()) return;
    setView('display');
    complete(submittedUserPrompt);
  };

  const EXAMPLES = [
    '🧑‍⚖️ Law firm website',
    '🤖 Multiple choice quiz about AI',
    '🎨 Color palette generator',
    '👥 Facebook-like social media timeline',
    '🎮 Asteroids game in a neon style',
    '😌 Satisfying interactive simulation',
    '📚 Reading speed measuring tool',
    '🧘 Meditation timer',
    '💪 Workout routine builder',
  ];

  if (view === 'prompt' || error || (!loading && !generatedCode)) {
    return (
      <main className="mx-auto px-4">
        <div className="mb-4">
          <LegacyText.H2 className="!mt-4">What do you want to build?</LegacyText.H2>
          <textarea
            placeholder="A website about..."
            value={userPrompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserPrompt(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSubmit();
              }
            }}
            className="w-full p-4 border border-gray-400 rounded-lg shadow-md"
            rows={1}
          />
          <Button
            onPress={() => handleSubmit()}
            disabled={loading || !userPrompt.trim()}
            className="float-right bottom-12.5 right-4 relative"
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
          <p>
            Examples:
            {EXAMPLES.map((example) => (
              <LinkOrButton
                className="cursor-pointer text-size-sm border rounded p-1 m-1 hover:bg-stone-200"
                key={example}
                onPress={() => {
                  setUserPrompt(example);
                  return handleSubmit(example);
                }}
              >{example}
              </LinkOrButton>
            ))}
          </p>
        </div>

        {error && (
        <>
          <LegacyText.H2 className="text-red-500">Something went wrong</LegacyText.H2>
          <LegacyText.P>
            Sorry, we couldn't generate your app. Error: {error?.message ?? 'Unknown'}
          </LegacyText.P>
          <LegacyText.P>
            Errors sometime happen when too many people are taking our course at once. You can try again later, or try <LinkOrButton url="https://web.lmarena.ai/" className="underline cursor-pointer">WebDev Arena</LinkOrButton> to see a similar demo.
          </LegacyText.P>
          <Button onPress={() => handleSubmit()}>Try again</Button>
        </>
        )}
      </main>
    );
  }

  if (view === 'display' && loading) {
    return (
      <main className="mx-auto px-4">
        <div className="text-center">
          <LegacyText.P className="text-size-xl font-medium mt-4 mb-2">AI is creating your webpage...</LegacyText.P>
          <LegacyText.P className="mb-6">Prompt: {userPrompt}</LegacyText.P>
          <ProgressDots />
        </div>
        <CodeRenderer code={generatedCode} height="calc(100vh - 150px)" hidePreview />
      </main>
    );
  }

  if (view === 'display' && generatedCode) {
    return (
      <main className="mx-auto px-4">
        <div className="flex flex-col gap-4 mt-2">
          <CodeRenderer code={generatedCode} height="calc(100vh - 70px)" />
          <div className="flex gap-2 w-fit relative bottom-12.5 mt-1 -mb-10">
            <ShareSavedDemoButton type="generate-react-component" data={JSON.stringify({ prompt: userPrompt, code: generatedCode })} text={`I just created an app with AI - using the prompt "${userPrompt}". You can check it out at this link:`} />
            <Button onPress={() => { setView('prompt'); setUserPrompt(''); }}>← Start over</Button>
          </div>
        </div>
      </main>
    );
  }

  // This should be unreachable as all view states are handled above
  return null;
};

export const GenerateReactComponentSavedDemoOutputViewer = ({ savedDemoOutput, courseLink }: { savedDemoOutput: SavedDemoOutput, courseLink: string }) => {
  const { prompt, code } = JSON.parse(savedDemoOutput.data);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="bg-gray-100 p-4 rounded-md">
        <LegacyText.P className="font-medium"><Link url={courseLink}>The Future of AI Course</Link> is a free 2-hour online experience to help you prepare for what might be humanity's biggest transition yet. It's packed with up-to-date interactive content - and in this demo, a student got AI to create this app based on the prompt "{prompt}".</LegacyText.P>
      </div>
      <CodeRenderer code={code} height="calc(100vh - 250px)" />
      <div className="flex gap-2 w-fit relative bottom-12.5 mt-1 -mb-10">
        <Button url={courseLink}>→ Start learning <span className="hidden md:inline">(and try this yourself)</span></Button>
      </div>
    </div>
  );
};

export default DemoPage;
