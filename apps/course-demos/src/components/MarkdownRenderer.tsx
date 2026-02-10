import type React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownRendererProps = {
  children?: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
  return (
    <div className="prose prose-sm [overflow-wrap:anywhere] max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  );
};

export default MarkdownRenderer;
