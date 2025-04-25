import React, { useEffect } from 'react';
import { evaluate } from '@mdx-js/mdx';
import { MDXContent } from 'mdx/types';
import clsx from 'clsx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import Greeting from './Greeting';
import Embed from './Embed';
import Callout from './Callout';
import Exercise from './exercises/Exercise';

/**
 * A remark plugin that unescapes backslashed characters in MDX component attribute values.
 * This fixes issues with escaped characters in MDX properties while preserving
 * escaped characters in regular markdown text.
 * This is useful for being able to use standard markdown editors, e.g. Airtable's markdown editor, for writing MDX.
 */
const remarkUnescapeMdxAttributes: Plugin = () => {
  return (tree) => {
    // Visit all MDX JSX elements in the syntax tree
    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
      // Process each attribute of the component
      node.attributes.forEach((attr) => {
        if (
          attr.type === 'mdxJsxAttribute'
            && typeof attr.value === 'string'
        ) {
          // Unescape common markdown characters in attribute values
          // eslint-disable-next-line no-param-reassign
          attr.value = attr.value.replace(
            /\\([_*[\]()#+\-.!`~])/g,
            '$1',
          );
        }
      });
    });
  };
};

export interface MarkdownRendererProps {
  children?: string;
  className?: string;
}

// This must be a function, rather than a constant, to avoid dependency cycles
export const getSupportedComponents = () => ({
  Greeting,
  Embed,
  Callout,
  Exercise,
});

const MarkdownExtendedRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  const [Component, setComponent] = React.useState<MDXContent | null>(null);
  useEffect(() => {
    if (!children) {
      return;
    }

    (async () => {
      const evalResult = await evaluate(children, {
        remarkPlugins: [remarkUnescapeMdxAttributes],
        Fragment: React.Fragment,
        jsx: React.createElement,
        jsxs: React.createElement,
      });
      setComponent(() => evalResult.default);
    })();
  }, [children, setComponent]);

  return (
    // See @utility prose in globals.css for advanced styles
    <div className={clsx('markdown-extended-renderer prose prose-p:text-size-md prose-li:text-size-md prose-p:leading-normal max-w-none', className)}>
      {Component && <Component components={getSupportedComponents()} />}
    </div>
  );
};

export default MarkdownExtendedRenderer;
