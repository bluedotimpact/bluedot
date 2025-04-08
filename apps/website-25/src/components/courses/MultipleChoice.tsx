import CTALinkOrButton from '@bluedot/ui/src/CTALinkOrButton';
import React from 'react';

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
  const [isCorrect, setIsCorrect] = React.useState<string | null>(null);
  const [isIncorrect, setIsIncorrect] = React.useState<string | null>(null);

  const isSelected = (option: string): boolean => {
    return selectedOption === option;
  };

  const isOptionCorrect = (option: string): boolean => {
    return isCorrect === option;
  };

  const isOptionIncorrect = (option: string): boolean => {
    return isIncorrect === option;
  };

  const answerCheck = () => {
    if (selectedOption === correctOption) {
      setIsCorrect(selectedOption);
      setIsIncorrect(null);
    } else {
      setIsIncorrect(selectedOption);
      setIsCorrect(null);
    }
  };

  return (
    <div className="multiple-choice container-lined bg-white p-8 flex flex-col gap-6">
        <div className="multiple-choice__header flex flex-col gap-4">
            <div className="multiple-choice__header-icon">
                <img src="/icons/lightning_bolt.svg" className="w-15 h-15" />
            </div>
            <div className="multiple-choice__header-content flex flex-col gap-2">
                <p className="multiple-choice__title subtitle-sm">{title}</p>
                <p className="multiple-choice__question">{question}</p>
            </div>
        </div>
      <div className="multiple-choice__options flex flex-col gap-2">
        {options.map((option) => (
          <label className={`
              multiple-choice__option flex items-center gap-2 p-4 hover:cursor-pointer
              ${isSelected(option) ? 'multiple-choice__option--selected container-active' : 'container-lined'}
              ${isOptionCorrect(option) ? 'multiple-choice__option--correct bg-[#63C96533] border-[#63C965]' : ''}
              ${isOptionIncorrect(option) ? 'multiple-choice__option--incorrect bg-[#FF636333] border-[#FF6363]' : ''}
            `}>
            <input
              className="multiple-choice__input"
              type="radio"
              name="multiple-choice"
              value={option}
              onChange={() => setSelectedOption(option)}
            />
            <span className="multiple-choice__label">{option}</span>
          </label>
        ))}
      </div>
      <CTALinkOrButton
        className="multiple-choice__submit" variant="primary"
        onClick={answerCheck}
      >
        Check
      </CTALinkOrButton>
    </div>
  );
};

export default MultipleChoice;
