import CTALinkOrButton from '@bluedot/ui/src/CTALinkOrButton';
import axios from 'axios';
import clsx from 'clsx';
import React from 'react';

type MultipleChoiceProps = {
  // Required
  answer: string;
  description: string;
  exerciseId: string;
  options: string;
  title: string;
  // Optional
  className?: string;
  exerciseResponse?: string;
};

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  answer,
  className,
  description,
  exerciseId,
  exerciseResponse,
  options,
  title,
}) => {
  /**
   * Options are stored as a string with newlines
   * Format them to be an array of strings with no empty strings (i.e., removing trailing return statements)
   */
  const formattedOptions = (options.split('\n').map((o) => o.trim()).filter((o) => o !== ''));
  const formattedAnswer = answer.trim();

  const [selectedOption, setSelectedOption] = React.useState<string | null>(exerciseResponse ?? null);
  const [submittedOption, setSubmittedOption] = React.useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setSubmittedOption(null); // Reset the submitted option when a new option is selected
  };

  const isSelected = (option: string): boolean => {
    return selectedOption === option;
  };

  const handleAnswerSubmit = () => {
    axios.put(`/api/courses/exercises/${exerciseId}/response`, {
      response: selectedOption,
    }).then(() => {
      setSubmittedOption(selectedOption);
    });
  };

  const isCorrect = submittedOption && submittedOption === formattedAnswer;
  const isIncorrect = submittedOption && submittedOption !== formattedAnswer;

  return (
    <div className={clsx('multiple-choice container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="multiple-choice__header flex flex-col gap-4">
        <div className="multiple-choice__header-icon">
          <img src="/icons/lightning_bolt.svg" className="w-15 h-15" alt="" />
        </div>
        <div className="multiple-choice__header-content flex flex-col gap-2">
          <p className="multiple-choice__title subtitle-sm">{title}</p>
          <p className="multiple-choice__description">{description}</p>
        </div>
      </div>
      <div className="multiple-choice__options flex flex-col gap-2">
        {formattedOptions.map((option) => (
          <label
            className={`
              multiple-choice__option flex items-center gap-2 p-4 hover:cursor-pointer
              ${isSelected(option) ? `multiple-choice__option--selected container-active
                ${isCorrect && 'multiple-choice__option--correct bg-[#63C96533] border-[#63C965]'}
                ${isIncorrect && 'multiple-choice__option--incorrect bg-[#FF636333] border-[#FF6363]'}`
              : 'container-lined'}`}
          >
            <input
              className="multiple-choice__input"
              type="radio"
              name="multiple-choice"
              value={option}
              onChange={() => handleOptionSelect(option)}
            />
            <span className="multiple-choice__label">{option}</span>
          </label>
        ))}
      </div>
      <CTALinkOrButton
        className="multiple-choice__submit"
        variant="primary"
        onClick={handleAnswerSubmit}
      >
        Check
      </CTALinkOrButton>
      {isCorrect && <p className="multiple-choice__correct-msg">Correct! Quiz completed. 🎉</p>}
      {isIncorrect && <p className="multiple-choice__incorrect-msg">Try again. 🤔</p>}
    </div>
  );
};

export default MultipleChoice;
