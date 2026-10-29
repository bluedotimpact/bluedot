import React, { useEffect } from 'react';
import { evaluate } from '@mdx-js/mdx';
import { type MDXContent } from 'mdx/types';
import clsx from 'clsx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { visit } from 'unist-util-visit';
import type { Plugin, Processor } from 'unified';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import { Collapsible } from '@bluedot/ui';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import Greeting from './Greeting';
import Embed from './Embed';
import { CollapsibleCallout } from './CollapsibleCallout';

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

          attr.value = attr.value.replace(
            /\\([_*[\]()#+\-.!`~])/g,
            '$1',
          );
        }
      });
    });
  };
};

/**
 * A remark plugin that turns off indented code blocks, as MDX does.
 * Plain markdown would otherwise show any line starting with 4 spaces as code.
 */
const remarkNoIndentedCode: Plugin = function remarkNoIndentedCode(this: Processor) {
  const data = this.data() as { micromarkExtensions?: unknown[] };
  const micromarkExtensions = data.micromarkExtensions ?? (data.micromarkExtensions = []);
  micromarkExtensions.push({ disable: { null: ['codeIndented'] } });
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

const PLAIN_MARKDOWN_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// True for web, email and relative addresses. Spaces and control characters are ignored, as browsers do
const isPlainMarkdownHref = (href: string | undefined): boolean => {
  const cleaned = [...(href ?? '')].filter((char) => char.charCodeAt(0) > 0x20 && char.charCodeAt(0) !== 0x7f).join('');
  const protocol = /^([a-z][a-z\d+.-]*:)/i.exec(cleaned)?.[1]?.toLowerCase();
  return !protocol || PLAIN_MARKDOWN_LINK_PROTOCOLS.includes(protocol);
};

// In plain markdown, links to any other kind of address show as their text only
const PlainMarkdownLink = ({ href, children, ...props }: React.ComponentProps<'a'>) => {
  if (!isPlainMarkdownHref(href)) {
    return <>{children}</>;
  }

  return <Link href={href} {...props}>{children}</Link>;
};

// Exported so pages that render their own markup can match this typography
export const MARKDOWN_PROSE_CLASSES = 'prose prose-p:text-size-sm prose-li:text-size-sm prose-p:leading-relaxed prose-li:leading-relaxed prose-p:font-normal prose-li:font-normal prose-p:font-sans prose-li:font-sans prose-strong:font-sans prose-strong:font-semibold prose-strong:text-size-sm prose-strong:leading-relaxed prose-a:font-normal prose-a:underline max-w-none';

export type MarkdownRendererProps = {
  children?: string;
  className?: string;
  /**
   * Render as plain markdown instead of MDX, so text like `{x}` or an `import` line shows as typed.
   * Use this for text that users write, such as exercise answers. Components like <Callout> don't work in this mode.
   */
  plainMarkdown?: boolean;
};

// This must be a function, rather than a constant, to avoid dependency cycles
export const getSupportedComponents = () => ({
  Greeting,
  Embed,
  Collapsible,
  // Authored course content uses the <Callout> tag
  Callout: CollapsibleCallout,
  Exercise,
  a: Link,
});

/**
 * Preprocesses Airtable content to escape characters that break MDX parsing.
 * Must run BEFORE evaluate() to prevent parse errors.
 */
const preprocessAirtableContent = (content: string): string => {
  let processed = content;

  // Convert autolinks to markdown links
  // <https://example.com> → [https://example.com](https://example.com)
  processed = processed.replace(
    /<(https?:\/\/[^\s>]+)>/g,
    '[$1]($1)',
  );

  // Get MDX component names from getSupportedComponents (excluding lowercase 'a' link override)
  const supportedComponents = Object.keys(getSupportedComponents()).filter((name) => {
    const firstChar = name[0];
    return firstChar === firstChar?.toUpperCase();
  });

  // Create regex pattern to match component names
  // Need to match both opening and closing tags: <Embed> and </Embed>
  const componentPattern = supportedComponents.join('|');
  const escapedComponentPattern = supportedComponents.map((name) => `\\/${name}`).join('|');

  // Fix Escape < that aren't part of JSX components
  // Preserves: <Embed>, <Callout>, <Exercise>, <Collapsible>, <Greeting>
  // Escapes everything else: <2000 → \<2000
  const regex = new RegExp(
    `<(?!(${componentPattern}|${escapedComponentPattern})\\b)`,
    'g',
  );
  processed = processed.replace(regex, '\\<');

  return processed;
};

// Custom jsxs function that adds keys to list items
// This is needed to fix React warnings about missing keys in lists
const jsxsWithKey = (type: React.ElementType, props: Record<string, unknown> & { children?: React.ReactNode }) => {
  const { children, ...restProps } = props;

  if (children && Array.isArray(children)) {
    const keyedChildren = children.map((child, index) => {
      if (React.isValidElement(child) && !child.key) {
        return React.cloneElement(child as React.ReactElement, { key: index });
      }

      return child;
    });
    return React.createElement(type, restProps, ...keyedChildren);
  }

  return React.createElement(type, restProps, children);
};

const MarkdownExtendedRenderer: React.FC<MarkdownRendererProps> = ({ children, className, plainMarkdown = false }) => {
  const [Component, setComponent] = React.useState<MDXContent | null>(null);
  const [failed, setFailed] = React.useState(false);

  useEffect(() => {
    if (!children) {
      return;
    }

    (async () => {
      try {
        const evalResult = await evaluate(preprocessAirtableContent(children), {
          format: plainMarkdown ? 'md' : 'mdx',
          remarkPlugins: [
            remarkBreaks,
            remarkUnescapeMdxAttributes,
            remarkGfm,
            ...(plainMarkdown ? [remarkNoIndentedCode] : []),
          ],
          Fragment: React.Fragment,
          jsx: React.createElement,
          jsxs: jsxsWithKey,
        });
        setFailed(false);
        setComponent(() => evalResult.default);
      } catch (error) {
        // Show the raw text rather than nothing, and rethrow so the error is still reported
        setComponent(null);
        setFailed(true);
        throw error;
      }
    })();
  }, [children, plainMarkdown, setComponent]);

  // Return null if there's no content to avoid rendering empty containers
  if (!children?.trim()) {
    return null;
  }

  return (
    // See @utility prose in globals.css for advanced styles
    <div className={clsx('markdown-extended-renderer', MARKDOWN_PROSE_CLASSES, className)}>
      {failed && <p className="whitespace-pre-wrap">{children}</p>}
      {!failed && Component && (
        <Component components={plainMarkdown ? { ...getSupportedComponents(), a: PlainMarkdownLink } : getSupportedComponents()} />
      )}
    </div>
  );
};

export default MarkdownExtendedRenderer;
