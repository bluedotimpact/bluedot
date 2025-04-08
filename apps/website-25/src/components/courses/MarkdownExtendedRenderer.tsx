import React, { useEffect } from 'react';
import { evaluate } from '@mdx-js/mdx';
import { MDXContent } from 'mdx/types';
import Greeting from './Greeting';

export interface MarkdownRendererProps {
  children?: string;
}

export const SUPPORTED_COMPONENTS = { Greeting };

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
    <div className="flex flex-col gap-4">
      {Component && <Component components={SUPPORTED_COMPONENTS} />}
    </div>
  );
};

export default MarkdownExtendedRenderer;
