import { z } from 'zod';
import axios from 'axios';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import env from '../../lib/api/env';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    userPrompt: z.string().min(1),
  }),
  responseBody: z.object({
    code: z.string(),
  }),
}, async (body) => {
  return {
    code: await getClaudeResponse(getPromptForUserPrompt(body.userPrompt))
  }
});

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

const getClaudeResponse = async (prompt: string): Promise<string> => {
  const response = await axios<{ content: { type: string, text?: string }[] }>({
    method: 'POST',
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    data: {
      model: 'claude-3-7-sonnet-20250219',
      // thinking: {
      //   type: 'enabled',
      //   budget_tokens: 1024,
      // },
      max_tokens: 8196,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    },
  });

  if (!Array.isArray(response.data.content)) {
    throw new Error('Got non-content response from Claude');
  }

  const textContent = response.data.content.filter((content) => content.type === 'text').map((content) => content.text).join('');
  if (textContent.length === 0) {
    throw new Error('Got non-text response from Claude');
  }

  return textContent;
};
