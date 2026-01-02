import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import FreeTextResponse, { type FreeTextResponseProps } from './FreeTextResponse';

type WrapperProps = Omit<FreeTextResponseProps, 'onExerciseSubmit'>;

const FreeTextResponseWrapper: React.FC<WrapperProps> = ({
  exerciseResponse: initialResponse = '',
  isCompleted: initialCompleted = false,
  ...props
}) => {
  // Mock the completion toggling
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [exerciseResponse, setExerciseResponse] = useState(initialResponse);

  return (
    <div className="pl-8">
      <FreeTextResponse
        {...props}
        exerciseResponse={exerciseResponse}
        isCompleted={isCompleted}
        onExerciseSubmit={async (response, completed) => {
          setExerciseResponse(response);
          if (completed !== undefined) {
            setIsCompleted(completed);
          }
        }}
      />
    </div>
  );
};

const meta = {
  title: 'website/courses/FreeTextResponse',
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  component: FreeTextResponseWrapper,
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof FreeTextResponseWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Understanding LLMs',
    description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  },
};

export const LoggedIn: Story = {
  args: {
    ...Default.args,
    isLoggedIn: true,
  },
};

export const Saved: Story = {
  args: {
    ...Default.args,
    exerciseResponse: 'This is my saved answer.',
    isLoggedIn: true,
  },
};

export const Completed: Story = {
  args: {
    ...Default.args,
    exerciseResponse: 'This is my saved answer.',
    isCompleted: true,
    isLoggedIn: true,
  },
};
