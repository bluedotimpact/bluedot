import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider,
} from '@codesandbox/sandpack-react';
import { P, CTALinkOrButton } from '@bluedot/ui';

type CodeRendererProps = {
  code: string;
  height?: string;
  hidePreview?: boolean;
};

export const CodeRenderer: React.FC<CodeRendererProps> = ({ code, height, hidePreview = false }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll to bottom when code updates
  useEffect(() => {
    if (view === 'code' && editorContainerRef.current) {
      const scrollContainer = editorContainerRef.current?.querySelector('.sp-code-editor');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [code, view]);

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
            {view === 'code' && (
              <div ref={editorContainerRef} style={{ width: '100%', height: '100%' }}>
                <SandpackCodeEditor showRunButton={false} style={{ height }} />
              </div>
            )}
          </SandpackLayout>
        </SandpackProvider>
      )}
      {view === 'load_preview' && <div style={{ height, margin: '0 1px' }} />}
      {!hidePreview && (
        <nav className="justify-end items-center flex gap-2">
          <P className="!my-0">Show:</P>
          <CTALinkOrButton variant={view === 'code' ? 'primary' : 'secondary'} onClick={() => setView('code')}>Code</CTALinkOrButton>
          <CTALinkOrButton variant={view === 'preview' ? 'primary' : 'secondary'} onClick={() => setView('load_preview')}>Preview</CTALinkOrButton>
        </nav>
      )}
    </>
  );
};
