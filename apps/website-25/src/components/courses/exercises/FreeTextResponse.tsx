import CTALinkOrButton from '@bluedot/ui/src/CTALinkOrButton';
import React from 'react';
import ReactMarkdown from 'react-markdown';

type FreeTextResponseProps = {
  // Required
  title: string;
  description: string;
  className?: string;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  title,
  description,
  className,
}) => {
  const [submittedOption, setSubmittedOption] = React.useState<string | null>(null);
  const [isSaved, setIsSaved] = React.useState<boolean>(false);

  const handleAnswerSubmit = () => {
    setSubmittedOption('test');
    setIsSaved(true);
  };

  const handleAnswerChange = () => {
    if (submittedOption && isSaved) {
      setIsSaved(false);
    }
  };

  return (
    <div className={`free-text-response container-lined bg-white p-8 flex flex-col gap-6 ${className}`}>
      <div className="free-text-response__header flex flex-col gap-4">
        <div className="free-text-response__header-icon">
          <img src="/icons/lightning_bolt.svg" className="w-15 h-15" alt="" />
        </div>
        <div className="free-text-response__header-content flex flex-col gap-2">
          <p className="free-text-response__title subtitle-sm">{title}</p>
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </div>
      <div className="free-text-response__options flex flex-col gap-2">
        <textarea
          className={`free-text-response__textarea p-4${
            isSaved ? ' free-text-response__textarea--saved container-active bg-[#63C96533] border-[#63C965] text-[#2A5D2A]' : ' container-lined'
          }`}
          placeholder="Enter your answer here"
          onChange={handleAnswerChange}
        />
      </div>
      <CTALinkOrButton
        className="free-text-response__submit"
        variant="primary"
        onClick={handleAnswerSubmit}
        type="button"
      >
        Save
      </CTALinkOrButton>
      {isSaved && <p className="free-text-response__saved-msg">Saved! 🎉</p>}
    </div>
  );
};

export default FreeTextResponse;
