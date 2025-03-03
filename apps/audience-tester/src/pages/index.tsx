import { useState } from 'react';
import {
  Button, H1, P, withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { TestAudienceResponse } from './api/test-audience';

const HomePage = withAuth(({ auth }) => {
  const [text, setText] = useState('');
  const [{ data, loading, error }, executeTest] = useAxios<TestAudienceResponse>(
    {
      url: '/api/test-audience',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    },
    { manual: true },
  );

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await executeTest({ data: { text } });
  };

  return (
    <div className="m-8 max-w-4xl">
      <H1>Audience Tester</H1>
      <P className="mt-4 mb-8">
        Paste in your argument or narrative to see how different people might respond to it.
        The app will simulate 25 different readers and provide their thoughts and feedback.
      </P>

      <div className="space-y-4">
        <textarea
          className="w-full h-64 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div>
          <Button
            onPress={handleSubmit}
            disabled={loading || !text.trim()}
          >
            {loading ? 'Testing...' : 'Test with Audience'}
          </Button>
        </div>

        {error && (
          <P className="text-red-600">
            Error: {error.message}
          </P>
        )}

        {data && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <H1 className="text-xl mb-4">Results</H1>
            <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
});

export default HomePage;
