import { anthropic } from '@ai-sdk/anthropic';
import { asError } from '@bluedot/ui';
import { StreamingResponseSchema } from '@bluedot/ui/src/api';
import { pipeUIMessageStreamToResponse, streamText } from 'ai';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    prompt: z.string().min(1).max(2_000),
  }),
  responseBody: StreamingResponseSchema,
}, async (body, { raw: { res } }) => {
  const fullPrompt = getPromptForUserPrompt(body.prompt);

  try {
    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      messages: [{
        role: 'user',
        content: fullPrompt,
      }],
      maxOutputTokens: 10_000,
    });

    pipeUIMessageStreamToResponse({
      response: res,
      stream: result.toUIMessageStream(),
      status: 200,
    });
  } catch (error: unknown) {
    throw new Error(`Error generating component: ${asError(error).message}`);
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
