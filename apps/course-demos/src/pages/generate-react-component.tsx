import React, { useState, useEffect } from 'react';
import {
  Button, H1, P, Card,
  H2,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';
import { LinkOrButton } from '@bluedot/ui/src/legacy/LinkOrButton';

const FakeProgressBar: React.FC<{ durationMs?: number }> = ({ durationMs = 60_000 }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    setProgress(0);
    const updateInterval = 250;
    const steps = durationMs / updateInterval;
    const increment = 96 / steps;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const randomNudgedIncrement = increment * 1 + (Math.random() - 0.5)
        const newProgress = prev + randomNudgedIncrement;
        return newProgress >= 96 ? 96 : newProgress;
      });
    }, updateInterval);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="w-4/5 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div 
          className="h-full bg-bluedot-normal rounded-full transition-all duration-300 ease-in"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </>
  );
};

const ProgressDots: React.FC = () => {
  return (
    <div className="flex justify-center space-x-2">
      <span className="h-2 w-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="h-2 w-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="h-2 w-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </div>
  )
}

const DemoPage: React.FC = () => {
  const [view, setView] = useState<'prompt' | 'display'>('prompt')
  const [userPrompt, setUserPrompt] = useState('');
  const [{ data, loading, error }, generateCode] = useAxios<{ code: string }>(
    {
      url: '/api/generate-react-component',
      method: 'POST',
    },
    { manual: true },
  );

  const handleSubmit = async (submittedUserPrompt: string = userPrompt) => {
    if (submittedUserPrompt !== userPrompt) {
      setUserPrompt(submittedUserPrompt);
    }
    if (!submittedUserPrompt.trim()) return;
    try {
      setView('display');
      await generateCode({ data: { userPrompt: submittedUserPrompt } });
    } catch (err) {
      console.error('Error generating component:', err);
    }
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
  ]

  if (view === 'prompt' || error) {
    return (
      <div className="mx-auto px-4">
      <div className="mb-4">
        <H2 className='!mt-4'>What do you want to build?</H2>
        <textarea
          placeholder="A website about..."
          value={userPrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserPrompt(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit()
            }
          }}
          className="w-full p-4 border border-gray-400 rounded-lg shadow-md"
          rows={1}
          autoFocus
        />
        <Button
          onPress={() => handleSubmit()}
          disabled={loading || !userPrompt.trim()}
          className='float-right bottom-12.5 right-4 relative'
        >
          {loading ? 'Creating...' : 'Create'}
        </Button>
        <p>
          Examples: 
          {EXAMPLES.map((example) => (
            <LinkOrButton className='cursor-pointer text-sm border rounded p-1 m-1 hover:bg-stone-200' key={example} onPress={() => {
              setUserPrompt(example);
              return handleSubmit(example)
            }}>{example}</LinkOrButton>
          ))}
        </p>
      </div>

      {error && (<>
        <H2 className='text-red-500'>Something went wrong</H2>
        <P>
          Sorry, we couldn't generate your app. Error: {error.message || 'Failed to create component'}
        </P>
        <P>
          This sometimes happens when too many people are taking our course at once. You can try again later, or try <LinkOrButton href="https://web.lmarena.ai/">WebDev Arena</LinkOrButton> to see a similar demo.
        </P>
        <Button onPress={() => handleSubmit()}>Try again</Button>
        </>)}
    </div>
    )
  }

  if (view === 'display' && loading) {
    return (
      <div className="mx-auto">
        <div className="text-center">
          <P className="text-xl font-medium mt-4 mb-2">AI is creating your webpage...</P>
          <P className="mb-6">Brief: {userPrompt}</P>
          <FakeProgressBar />
        </div>
      </div>
    );
  }

  if (view === 'display') {
    return (
      <div className="mx-auto px-4">
        {data && (
          <div className="flex flex-col gap-4 mt-2">
            <CodeRenderer code={data.code} height={'calc(100vh - 70px)'} />
            <Button onPress={() => setView('prompt')}>← Start over<span className="hidden md:inline"> to create something new</span></Button>
          </div>
        )}
      </div>
    );
  }

  // This should be unreachable as all view states are handled above
  view satisfies never;
};

const CodeRenderer: React.FC<{ code: string, height?: string }> = ({ code, height }) => {  
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
    }
  };

  return (
    <SandpackProvider
      template="react"
      files={files}
      options={{
        externalResources: ["https://cdn.tailwindcss.com"],
      }}>
      <SandpackLayout>
        <SandpackPreview showOpenInCodeSandbox={false} style={{ height }} />
        <SandpackCodeEditor style={{ height }} />
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default DemoPage;
