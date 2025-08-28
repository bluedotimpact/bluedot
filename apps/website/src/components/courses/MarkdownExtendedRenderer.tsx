import React, { useEffect } from 'react';
import { evaluate } from '@mdx-js/mdx';
import { MDXContent } from 'mdx/types';
import clsx from 'clsx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import { Collapsible } from '@bluedot/ui';
import remarkGfm from 'remark-gfm';
import Greeting from './Greeting';
import Embed from './Embed';
import Callout from './Callout';
// eslint-disable-next-line import/no-cycle
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

// Custom link component to handle external links
const Link = ({ href, children, ...props }: React.ComponentProps<'a'>) => {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return <a href={href} {...props}>{children}</a>;
};

export type MarkdownRendererProps = {
  children?: string;
  className?: string;
};

// This must be a function, rather than a constant, to avoid dependency cycles
export const getSupportedComponents = () => ({
  Greeting,
  Embed,
  Collapsible,
  Callout,
  Exercise,
  a: Link,
});

const MarkdownExtendedRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  const [Component, setComponent] = React.useState<MDXContent | null>(null);

  useEffect(() => {
    if (!children) {
      return;
    }

    (async () => {
      const evalResult = await evaluate(children, {
        remarkPlugins: [remarkUnescapeMdxAttributes, remarkGfm],
        Fragment: React.Fragment,
        jsx: React.createElement,
        jsxs: React.createElement,
      });
      setComponent(() => evalResult.default);
    })();
  }, [children, setComponent]);

  // Return null if there's no content to avoid rendering empty containers
  if (!children || !children.trim()) {
    return null;
  }

  return (
    // See @utility prose in globals.css for advanced styles
    <div className={clsx('markdown-extended-renderer prose prose-p:text-[16px] prose-li:text-[16px] prose-p:leading-[160%] prose-li:leading-[160%] prose-p:tracking-[-0.002em] prose-li:tracking-[-0.002em] prose-p:font-normal prose-li:font-normal prose-p:font-sans prose-li:font-sans prose-strong:font-sans prose-strong:font-semibold prose-strong:text-[16px] prose-strong:leading-[160%] prose-strong:tracking-[-0.002em] prose-a:font-normal prose-a:underline max-w-none', className)}>
      {Component && <Component components={getSupportedComponents()} />}
    </div>
  );
};

export default MarkdownExtendedRenderer;
