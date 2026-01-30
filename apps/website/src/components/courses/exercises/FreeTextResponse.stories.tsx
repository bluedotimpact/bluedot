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
  component: FreeTextResponseWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof FreeTextResponseWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const LoggedIn: Story = {
  args: {
    isLoggedIn: true,
  },
};

export const Saved: Story = {
  args: {
    exerciseResponse: 'This is my saved answer.',
    isLoggedIn: true,
  },
};

export const Completed: Story = {
  args: {
    exerciseResponse: 'This is my saved answer.',
    isCompleted: true,
    isLoggedIn: true,
  },
};
