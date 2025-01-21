
export function useMDXComponents(components: any): any {
  return {
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 mt-8">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold mb-4 mt-8">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-bold mb-4 mt-6">{children}</h3>,
    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4 ml-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 ml-4">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4">{children}</blockquote>
    ),
    ...components,
  }
}

