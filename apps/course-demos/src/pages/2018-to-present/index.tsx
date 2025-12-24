import React, { useState } from 'react';
import { ClickTarget, H3 } from '@bluedot/ui';
import prompts from './responses.json';
import MarkdownRenderer from '../../components/MarkdownRenderer';

type Response = {
  model: string;
  text: string;
  correct?: boolean,
  correctness_reason?: string,
};

type Prompt = {
  text: string;
  shortText: string;
  difficulty: string | 'EASY' | 'MEDIUM' | 'HARD';
  responses: Response[];
};

prompts satisfies Prompt[];

const models = {
  'GPT-1': { name: 'GPT-1', releaseYear: 2018 },
  'GPT-3': { name: 'GPT-3', releaseYear: 2020 },
  'GPT-3.5': { name: 'GPT-3.5', releaseYear: 2022 },
  'GPT-4': { name: 'GPT-4', releaseYear: 2023 },
  'o3-mini': { name: 'o3-mini', releaseYear: 2025 },
  'deep-research': { name: 'OpenAI Deep Research', releaseYear: 2025 },
};

const AIModelResponse: React.FC<{
  response: Response;
}> = ({ response }) => {
  const model = models[response.model as keyof typeof models];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 relative">
        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg flex items-center gap-2">
          <span>{model.releaseYear}</span>
        </div>
        <span className="text-size-lg font-medium">{model.name}</span>
        {response.correct !== undefined && (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          <span tabIndex={response.correctness_reason ? 0 : undefined} className={`px-2 py-0.5 text-xs font-medium rounded-full ${response.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} group ${response.correctness_reason ? 'underline decoration-dotted cursor-help' : ''}`}>
            {response.correct ? 'Correct' : 'Incorrect'}
            {response.correctness_reason && (
              <div role="tooltip" className="absolute left-0 bottom-full mb-2 bg-gray-800 text-white p-2 rounded text-size-sm w-full hidden opacity-0 group-hover:block group-focus:block group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                {response.correctness_reason}
              </div>
            )}
          </span>
        )}
      </div>

      <div className="bg-white shadow p-4 rounded-lg">
        <div className="flex items-start">
          <div className="mr-2 hidden md:block">🤖</div>
          <MarkdownRenderer>{response.text}</MarkdownRenderer>
        </div>
      </div>
    </div>
  );
};

const DemoPage: React.FC = () => {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const rawSelectedPrompt = prompts[selectedPromptIndex]!;
  const selectedPrompt = {
    ...rawSelectedPrompt,
    responses: rawSelectedPrompt.responses.length > 4
      // If there are too many prompts
      ? prompts[selectedPromptIndex]!.responses.filter((response) => {
        // If there's both GPT-3.5 and GPT-4, hide GPT-4 because it's usually similar to GPT-3.5 anyway and gives us a better spread of years
        if (prompts[selectedPromptIndex]!.responses.some((r) => r.model === 'GPT-3.5') && response.model === 'GPT-4') {
          return false;
        }

        // If there's both deep research and o3, hide o3 because deep research was released the same year and tends to be better
        if (prompts[selectedPromptIndex]!.responses.some((r) => r.model === 'deep-research') && response.model === 'o3-mini') {
          return false;
        }

        return true;
      })
        // Then display the last 4 (usually the most advanced)
        .reverse().slice(0, 4).reverse()
      : rawSelectedPrompt.responses,
  };

  return (
    <main className="mx-auto px-4">
      <div className="mb-8">
        <H3 className="my-2">Examples:</H3>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt, index) => (
            <ClickTarget
              // eslint-disable-next-line react/no-array-index-key -- stable as prompts array is constant
              key={index}
              onClick={() => setSelectedPromptIndex(index)}
              className={`text-sm border rounded p-2 hover:bg-stone-100 cursor-pointer ${index === selectedPromptIndex ? 'bg-stone-200' : ''}`}
            >
              {prompt.shortText ?? prompt.text}
            </ClickTarget>
          ))}
        </div>

        <div className="bg-white shadow p-4 rounded-lg mt-4">
          <div className="flex items-start">
            <div className="mr-2 hidden md:block">🗣️</div>
            <MarkdownRenderer>{selectedPrompt.text}</MarkdownRenderer>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedPrompt.responses.map((response) => (
          <AIModelResponse
            key={response.model}
            response={response}
          />
        ))}
      </div>
    </main>
  );
};

export default DemoPage;
