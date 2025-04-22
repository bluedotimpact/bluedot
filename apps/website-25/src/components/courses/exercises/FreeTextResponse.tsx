import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';
import axios from 'axios';
import React from 'react';
import ReactMarkdown from 'react-markdown';

type FreeTextResponseProps = {
  // Required
  className?: string;
  description: string;
  exerciseId: string;
  title: string;
  // Optional
  exerciseResponse?: string;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  className,
  description,
  exerciseId,
  exerciseResponse,
  title,
}) => {
  const [isSaved, setIsSaved] = React.useState<boolean>(false);

  const handleAnswerSubmit = () => {
    const textArea = document.querySelector('.free-text-response__textarea') as HTMLTextAreaElement;
    axios.put(`/api/courses/exercises/${exerciseId}/response`, {
      response: textArea?.value,
    }).then(() => {
      setIsSaved(true);
    });
  };

  const handleAnswerChange = () => {
    if (isSaved) {
      setIsSaved(false);
    }
  };

  return (
    <div className={clsx('free-text-response container-lined bg-white p-8 flex flex-col gap-6', className)}>
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
          value={exerciseResponse}
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
