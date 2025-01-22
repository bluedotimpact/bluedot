import { ReactNode } from 'react';

export function useMDXComponents(components: any): any {
  return {
    h1: ({ children }: { children: ReactNode }) => <h1 className="text-4xl font-bold mb-6 mt-8">{children}</h1>,
    h2: ({ children }: { children: ReactNode }) => <h2 className="text-3xl font-bold mb-4 mt-8">{children}</h2>,
    h3: ({ children }: { children: ReactNode }) => <h3 className="text-2xl font-bold mb-4 mt-6">{children}</h3>,
    p: ({ children }: { children: ReactNode }) => <p className="mb-4 leading-relaxed">{children}</p>,
    blockquote: ({ children }: { children: { props: { content: { type: string, text: string }[] } } }) => {
      const props = children.props.content[0];
      return (
        <blockquote className="my-12">
          <p className="text-2xl md:text-3xl font-serif text-center mb-6 px-4 md:px-8">{props?.text}</p>
        </blockquote>
      );
    },
    img: ({ url, caption }: { url: string, caption: string }) => {
      return (
        <figure className="my-8">
          <div className="aspect-[16/9] bg-blue-100 rounded-lg overflow-hidden">
            <img
              src={url || '/placeholder.svg'}
              alt={caption || ''}
              width={1200}
              height={675}
              className="w-full h-full object-cover"
            />
          </div>
          {caption && <figcaption className="mt-2 text-center text-sm italic text-gray-600">{caption}</figcaption>}
        </figure>
      );
    },
    code: ({ children, className }: { children: string, className: string }) => {
      // If it's an inline code block
      if (!className) {
        return <code className="bg-blue-100 rounded px-1.5 py-0.5 text-blue-900">{children}</code>;
      }

      // For multiline code blocks
      const [, language] = className?.split('-') || [];
      const codeString = Array.isArray(children) ? children.join('') : children;
      const [code, caption] = codeString.split('//').map((str) => str.trim());

      return (
        <figure className="my-8">
          <pre className={`bg-[#4339ca] text-white rounded-lg p-4 overflow-x-auto language-${language}`}>
            <code>{code}</code>
          </pre>
          {caption && <figcaption className="mt-2 text-center text-sm italic text-gray-600">{caption}</figcaption>}
        </figure>
      );
    },
    pre: ({ children }: { children: ReactNode }) => <div className="not-prose my-8">{children}</div>,
    strong: ({ children }: { children: ReactNode }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }: { children: ReactNode }) => <em className="italic">{children}</em>,
    ul: ({ children }: { children: ReactNode }) => <ul className="list-disc list-inside mb-4 ml-4">{children}</ul>,
    ol: ({ children }: { children: ReactNode }) => <ol className="list-decimal list-inside mb-4 ml-4">{children}</ol>,
    li: ({ children }: { children: ReactNode }) => <li className="mb-2">{children}</li>,
    ...components,
  };
}
