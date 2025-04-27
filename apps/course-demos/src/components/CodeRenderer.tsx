import React, { useState, useEffect } from 'react';
import {
  SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider,
} from '@codesandbox/sandpack-react';
import { LegacyText, Button } from '@bluedot/ui';

interface CodeRendererProps {
  code: string;
  height?: string;
  hidePreview?: boolean;
}

export const CodeRenderer: React.FC<CodeRendererProps> = ({ code, height, hidePreview = false }) => {
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
        <LegacyText.P className="!my-0">Show:</LegacyText.P>
        <Button className={view === 'code' ? 'bg-bluedot-lighter' : ''} onPress={() => setView('code')}>Code</Button>
        <Button className={view === 'preview' ? 'bg-bluedot-lighter' : ''} onPress={() => setView('load_preview')}>Preview</Button>
      </nav>
      )}
    </>
  );
};
