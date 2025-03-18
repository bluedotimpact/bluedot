import React, { useState, useEffect } from 'react';
import { Button, H2, P } from '@bluedot/ui';
import { useCompletion } from '@ai-sdk/react';
import {
  SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider,
} from '@codesandbox/sandpack-react';
import { LinkOrButton } from '@bluedot/ui/src/legacy/LinkOrButton';
import { ShareButton } from '../components/ShareButton';

const ProgressDots: React.FC = () => {
  return (
    <div className="flex justify-center space-x-2 my-6">
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

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
    '✏️ Whiteboard drawing canvas',
    '💪 Workout routine builder',
  ];

  if (view === 'prompt' || error || (!loading && !generatedCode)) {
    return (
      <main className="mx-auto px-4">
        <div className="mb-4">
          <H2 className="!mt-4">What do you want to build?</H2>
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
                className="cursor-pointer text-sm border rounded p-1 m-1 hover:bg-stone-200"
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
          <H2 className="text-red-500">Something went wrong</H2>
          <P>
            Sorry, we couldn't generate your app. Error: {error?.message ?? 'Unknown'}
          </P>
          <P>
            Errors sometime happen when too many people are taking our course at once. You can try again later, or try <LinkOrButton href="https://web.lmarena.ai/" className="underline cursor-pointer">WebDev Arena</LinkOrButton> to see a similar demo.
          </P>
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
          <P className="text-xl font-medium mt-4 mb-2">AI is creating your webpage...</P>
          <P className="mb-6">Brief: {userPrompt}</P>
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
            <ShareButton type="generate-react-component" data={JSON.stringify({ prompt: userPrompt, code: generatedCode })} />
            <Button onPress={() => { setView('prompt'); setUserPrompt(''); }}>← Start over</Button>
          </div>
        </div>
      </main>
    );
  }

  // This should be unreachable as all view states are handled above
  return null;
};

const CodeRenderer: React.FC<{ code: string, height?: string, hidePreview?: boolean }> = ({ code, height, hidePreview = false }) => {
  const files = {
    '/App.js': {
      code: `import React from 'react';

${code}

export default function App() {
  return (
    <Component />
  );
}
`,
      readOnly: true,
    },
  };

  const [view, setView] = useState<'code' | 'load_preview' | 'preview'>(hidePreview ? 'code' : 'preview');
  // This is a hack to refresh the SandpackProvider so the preview refreshes
  useEffect(() => {
    if (view === 'load_preview') {
      setView('preview');
    }
  }, [view]);

  return (
    <>
      {view !== 'load_preview'
    && (
    <SandpackProvider
      template="react"
      files={files}
      options={{
        externalResources: ['https://cdn.tailwindcss.com'],
      }}
    >
      <SandpackLayout>
        {view === 'preview' && <SandpackPreview showOpenInCodeSandbox={false} style={{ height }} />}
        {view === 'code' && <SandpackCodeEditor showRunButton={false} style={{ height }} />}
      </SandpackLayout>
    </SandpackProvider>
    )}
      {view === 'load_preview' && <div style={{ height, margin: '0 1px' }} />}
      {!hidePreview && (
      <nav className="justify-end items-center flex gap-2">
        <P className="!my-0">Show:</P>
        <Button className={view === 'code' ? 'bg-bluedot-lighter' : ''} onPress={() => setView('code')}>Code</Button>
        <Button className={view === 'preview' ? 'bg-bluedot-lighter' : ''} onPress={() => setView('load_preview')}>Preview</Button>
      </nav>
      )}
    </>
  );
};

export default DemoPage;
