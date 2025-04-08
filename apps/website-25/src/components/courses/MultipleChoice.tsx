import CTALinkOrButton from '@bluedot/ui/src/CTALinkOrButton';
import React from 'react';
import ReactMarkdown from 'react-markdown';

type MultipleChoiceProps = {
  // Required
  title: string;
  question: string;
  options: string[];
  correctOption: string;
};

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  title,
  question,
  options,
  correctOption,
}) => {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [submittedOption, setSubmittedOption] = React.useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setSubmittedOption(null); // Reset the submitted option when a new option is selected
  };

  const isSelected = (option: string): boolean => {
    return selectedOption === option;
  };

  const handleAnswerSubmit = () => {
    setSubmittedOption(selectedOption);
  };

  const isCorrect = submittedOption && submittedOption === correctOption;
  const isIncorrect = submittedOption && submittedOption !== correctOption;

  return (
    <div className="multiple-choice container-lined bg-white p-8 flex flex-col gap-6">
      <div className="multiple-choice__header flex flex-col gap-4">
        <div className="multiple-choice__header-icon">
          <img src="/icons/lightning_bolt.svg" className="w-15 h-15" alt="" />
        </div>
        <div className="multiple-choice__header-content flex flex-col gap-2">
          <p className="multiple-choice__title subtitle-sm">{title}</p>
          <ReactMarkdown>{question}</ReactMarkdown>
        </div>
      </div>
      <div className="multiple-choice__options flex flex-col gap-2">
        {options.map((option) => (
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
