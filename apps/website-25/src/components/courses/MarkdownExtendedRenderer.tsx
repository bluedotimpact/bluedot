import React, { useEffect } from 'react';
import { evaluateSync } from '@mdx-js/mdx';
import { MDXContent } from 'mdx/types';
import Greeting from './Greeting';

interface MarkdownRendererProps {
  children?: string;
}

const MarkdownExtendedRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
  const [Component, setComponent] = React.useState<MDXContent | null>(null);
  useEffect(() => {
    if (!children) {
      return;
    }

    const evalResult = evaluateSync(children, {
      Fragment: React.Fragment,
      jsx: React.createElement,
      jsxs: React.createElement,
    });
    setComponent(() => evalResult.default);
  }, [children, setComponent]);

  return (
    <div className="flex flex-col gap-4">
      {Component && <Component components={{ Greeting }} />}
    </div>
  );
};

export default MarkdownExtendedRenderer;
