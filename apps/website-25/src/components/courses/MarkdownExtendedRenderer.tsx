import React, { useEffect } from 'react';
import { evaluate } from '@mdx-js/mdx';
import { MDXContent } from 'mdx/types';
import Greeting from './Greeting';
import Embed from './Embed';
// eslint-disable-next-line import/no-cycle
import Callout from './Callout';
import Exercise from './exercises/Exercise';

export interface MarkdownRendererProps {
  children?: string;
}

// This must be a function, rather than a constant, to avoid dependency cycles
export const getSupportedComponents = () => ({
  Greeting,
  Embed,
  Callout,
  Exercise,
});

const MarkdownExtendedRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
  const [Component, setComponent] = React.useState<MDXContent | null>(null);
  useEffect(() => {
    if (!children) {
      return;
    }

    (async () => {
      const evalResult = await evaluate(children, {
        Fragment: React.Fragment,
        jsx: React.createElement,
        jsxs: React.createElement,
      });
      setComponent(() => evalResult.default);
    })();
  }, [children, setComponent]);

  return (
    <div className="markdown-extended-renderer flex flex-col gap-4">
      {Component && <Component components={getSupportedComponents()} />}
    </div>
  );
};

export default MarkdownExtendedRenderer;
