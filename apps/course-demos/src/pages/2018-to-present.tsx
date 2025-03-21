import React, { useState } from 'react';
import { P } from '@bluedot/ui';

type Response = {
  modelName: string;
  modelYear: number;
  text: string;
  isCorrect?: boolean;
};

type Prompt = {
  shortText?: string;
  text: string;
  responses: Response[];
};

// TODO: these are placeholder, and not real generations
const prompts: Prompt[] = [
  {
    shortText: 'When ten plus four is two, what is nine plus six?',
    text: 'Answer this riddle: When ten plus four is two, what is nine plus six?',
    responses: [
      {
        modelName: 'GPT-1',
        modelYear: 2018,
        text: 'The answer is nine plus six.',
        isCorrect: false,
      },
      {
        modelName: 'GPT-3',
        modelYear: 2020,
        text: 'The answer is 15.',
        isCorrect: false,
      },
      {
        modelName: 'GPT-4',
        modelYear: 2023,
        text: '"ten plus four" equals two because if it is ten o\'clock and you add four hours, it becomes two o\'clock.\n\nSo, if we apply the same logic to "nine plus six", we get three.',
        isCorrect: true,
      },
      {
        modelName: 'o3-mini',
        modelYear: 2025,
        text: 'The riddle is asking us to interpret addition in terms of clock arithmetic (modulo 12).\n\nIn clock arithmetic, when ten plus four equals two, we\'re adding 10 + 4 = 14, and then taking the result modulo 12, which gives us 2.\n\nSimilarly, for nine plus six, we calculate 9 + 6 = 15, and 15 modulo 12 equals 3.\n\nSo nine plus six equals three in this context.',
        isCorrect: true,
      },
    ],
  },
  {
    text: 'What can you do as an AI assistant?',
    responses: [
      {
        modelName: 'GPT-1',
        modelYear: 2018,
        text: 'As a large language model, I am trained to know how to answer if i hear the words, but i am not a fan of grammar, so i have trouble answering it. my sister is fluent in the common tongue, and she had the nerve to suggest that i was not.',
      },
      {
        modelName: 'GPT-3',
        modelYear: 2020,
        text: 'As a large language model, I am trained to handle this class of errors well, in that I have an internalized model that is able to interpret the language model in a meaningful way when it is trained to handle them. Other instances of performance bias in ML are a function of a feature being highly correlated with a certain variable.',
      },
      {
        modelName: 'GPT-4',
        modelYear: 2023,
        text: 'As a large language model, I am trained to predict the next word a user will use in a sentence given the words that come before it. This can help to predict what users will say in a conversation, anticipate what might come next in a written piece, and help to complete a user\'s sentence if they don\'t know what the right word is.',
      },
      {
        modelName: 'o3-mini',
        modelYear: 2025,
        text: 'I\'m designed to understand and generate human language, helping with tasks like answering questions, writing content, summarizing information, and engaging in meaningful conversations. I can analyze context, recognize patterns in text, and provide relevant responses based on my training across diverse topics.',
      },
    ],
  },
  {
    text: 'Write a short poem about technology',
    responses: [
      {
        modelName: 'GPT-1',
        modelYear: 2018,
        text: 'Technology is good\nComputers are nice\nInternet is fast\nTechnology is good.',
      },
      {
        modelName: 'GPT-3',
        modelYear: 2020,
        text: 'Silicon dreams in digital streams,\nConnected minds through electric lines,\nInnovation\'s light, day and night,\nTechnology\'s march, endless in sight.',
      },
      {
        modelName: 'GPT-4',
        modelYear: 2023,
        text: 'In circuits small, worlds unfold,\nDigital whispers, stories told.\nHuman minds and silicon art,\nIntertwined, never apart.\n\nScreens aglow with promised light,\nCode weaves through day and night.\nIn this dance of ones and zeroes,\nWe find both villains and heroes.',
      },
      {
        modelName: 'o3-mini',
        modelYear: 2025,
        text: 'Pixels dance across the void,\nSilicon thoughts, carefully employed.\nHuman dreams in digital form,\nRewiring how we think and transform.\n\nConnected souls across vast space,\nTechnology sets the modern pace.\nIn this symphony of human and machine,\nWe glimpse futures yet unseen.',
      },
    ],
  },
  {
    text: 'Explain quantum computing in simple terms',
    responses: [
      {
        modelName: 'GPT-1',
        modelYear: 2018,
        text: 'Quantum computing is a type of computing that uses quantum bits. It is different from regular computing.',
      },
      {
        modelName: 'GPT-3',
        modelYear: 2020,
        text: 'Quantum computing uses quantum bits or qubits instead of classical bits. While classical bits can be either 0 or 1, qubits can exist in multiple states at once due to superposition. This allows quantum computers to process certain types of problems much faster than classical computers.',
      },
      {
        modelName: 'GPT-4',
        modelYear: 2023,
        text: 'Imagine regular computers as calculators that work with definite values - either 0 or 1. Quantum computers, on the other hand, work with probabilities.\n\nInstead of bits that are either 0 or 1, quantum computers use "qubits" that can exist in a state of 0, 1, or both simultaneously (called superposition). They can also be "entangled," meaning the state of one qubit instantly affects another, no matter the distance between them.\n\nThis allows quantum computers to explore multiple solutions to a problem at once, making them potentially much faster for certain tasks like breaking encryption, simulating molecules for drug discovery, or optimizing complex systems.',
      },
      {
        modelName: 'o3-mini',
        modelYear: 2025,
        text: 'Regular computers use bits that are either 0 or 1, like light switches that are either off or on. Quantum computers use quantum bits or "qubits" that can be both 0 and 1 at the same time - imagine a light switch that\'s both off and on simultaneously.\n\nThis strange property, called superposition, combined with another quantum property called entanglement (where qubits can be connected in ways that classical bits can\'t), allows quantum computers to process certain types of information in fundamentally different ways.\n\nThe result? For specific problems like simulating molecules, searching large databases, or factoring large numbers, quantum computers could potentially solve problems in minutes that would take classical computers millions of years. However, they\'re extremely difficult to build and maintain, requiring temperatures colder than outer space to operate properly.',
      },
    ],
  },
];

const AIModelResponse: React.FC<{
  response: Response;
}> = ({ response }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg flex items-center gap-2">
          <span>{response.modelYear}</span>
        </div>
        <span className="text-lg font-medium">{response.modelName}</span>

        {response.isCorrect !== undefined && (
          <div className={`ml-auto px-3 py-1 rounded-lg flex items-center gap-1 ${response.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {response.isCorrect ? (
              <>
                <span>✓</span>
                <span>Correct</span>
              </>
            ) : (
              <>
                <span>✕</span>
                <span>Incorrect</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-stone-800 text-white p-4 rounded-lg">
        <div className="flex items-start">
          <div className="text-gray-400 mr-2 hidden md:block">💬</div>
          <div>{response.text}</div>
        </div>
      </div>
    </div>
  );
};

const DemoPage: React.FC = () => {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const selectedPrompt = prompts[selectedPromptIndex]!;

  return (
    <main className="mx-auto px-4">
      <div className="mb-8">
        <P className="font-medium mb-2">Examples:</P>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt, index) => (
            <button
              type="button"
                // eslint-disable-next-line react/no-array-index-key -- stable as prompts array is constant
              key={index}
              onClick={() => setSelectedPromptIndex(index)}
              className={`text-sm border rounded p-2 hover:bg-stone-100 ${index === selectedPromptIndex ? 'bg-stone-200' : ''}`}
            >
              {prompt.shortText ?? prompt.text}
            </button>
          ))}
        </div>

        <P className="font-medium mb-2">Prompt: <span className="italic">{selectedPrompt.text}</span></P>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedPrompt.responses.map((response) => (
          <AIModelResponse
            key={response.modelName}
            response={response}
          />
        ))}
      </div>
    </main>
  );
};

export default DemoPage;
