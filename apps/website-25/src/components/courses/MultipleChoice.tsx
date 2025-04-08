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

  return (
    <div className="multiple-choice container-lined bg-white p-8 flex flex-col gap-6">
        <div className="multiple-choice__header flex flex-col gap-4">
            <div className="multiple-choice__header-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 8C0 3.58172 3.58172 0 8 0H52C56.4183 0 60 3.58172 60 8V52C60 56.4183 56.4183 60 52 60H8C3.58172 60 0 56.4183 0 52V8Z" fill="#0037FF" fill-opacity="0.15"/>
                <path d="M31.1667 18.3333L19.5 32.3333H30L28.8333 41.6666L40.5 27.6666H30L31.1667 18.3333Z" stroke="#0037FF" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </div>
            <div className="flex flex-col gap-2">
                <p className="multiple-choice__title subtitle-sm">{title}</p>
                <p className="multiple-choice__question">{question}</p>
            </div>
        </div>
      <div className="multiple-choice__options flex flex-col gap-2">
        {options.map((option) => (
          <label className={`multiple-choice__option flex items-center gap-2 p-4 ${selectedOption === option ? 'container-active' : 'container-lined'}`}>
            <input 
              type="radio"
              name="multiple-choice"
              value={option}
              className="multiple-choice__input"
              onChange={() => setSelectedOption(option)}
            />
            <span className="multiple-choice__label">{option}</span>
          </label>
        ))}
      </div>
      <CTALinkOrButton variant="primary">
        Check
      </CTALinkOrButton>
    </div>
  );
};

export default MultipleChoice;
