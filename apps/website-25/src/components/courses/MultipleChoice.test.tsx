import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import MultipleChoice from './MultipleChoice';

describe('MultipleChoice', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <MultipleChoice
        title={"Understanding LLMs"}
        question={`Why is a language model's ability to predict "the next word" capable of producing complex behaviors like solving maths problems?`}
        options={[
          "The training data includes explicit instructions for these tasks",
          "The training data includes implicit instructions for these tasks",
          "The training data includes no instructions for these tasks"
        ]}
        correctOption={"The training data includes explicit instructions for these tasks"}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  // TODO: Add tests for selected option UI
  // TODO: Add tests for correct option submitted
  // TODO: Add tests for incorrect option submitted

});
