import { anthropic } from '@ai-sdk/anthropic';
import { pipeDataStreamToResponse, streamText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    console.log(req.body)

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid userPrompt is required' });
    }

    const fullPrompt = getPromptForUserPrompt(prompt);
    
    pipeDataStreamToResponse(res, {
      status: 200,
      execute: async (dataStream) => {
        const result = streamText({
          model: anthropic('claude-3-7-sonnet-20250219'),
          messages: [{
            role: 'user',
            content: fullPrompt,
          }],
          maxTokens: 10_000,
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error: any) => `Error generating component: ${error}`,
    });
  } catch (error) {
    console.error('Error in generate-react-component API:', error);
    res.status(500).json({ error: 'Failed to generate component' });
  }
}

/**
 * Enhances the user's prompt with specific instructions for Claude
 * to build a React component using only Tailwind CSS
 */
const getPromptForUserPrompt = (userPrompt: string): string => {
  return `
I need you to create a React component based on the following description:

${userPrompt}

Please follow these requirements:
1. You should output a React functional component in JavaScript named 'Component' (you can also declare other components, as long as your final output is named Component)
2. Use Tailwind CSS classes or inline styles for styling
3. Do not use any external libraries or any import statements. React is available as a global.
4. Make the component follow responsive design principles
5. Do not include any comments
6. Return ONLY the component code without any explanation or backticks code block formatting

Example output:
const Component = () => {
  const [count, setCount] = React.useState(0);

  return (<>
    <h2 className="text-2xl">{count}</h2>
    <button onClick={() => setCount(count + 1)}>+</button>
  </>)
}`;
};
