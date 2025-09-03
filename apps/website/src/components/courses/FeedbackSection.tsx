import { CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';
import { useId, useState } from 'react';

const ThumbIcon: React.FC<{
  color?: string;
  filled?: boolean;
  isDislike?: boolean;
}> = ({ color = 'currentColor', filled = false, isDislike = false }) => {
  const clipId = useId();
  // Flip vertically for dislike (thumbs down)
  const transform = isDislike ? 'scale(1, -1) translate(0, -16)' : undefined;

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clipPath={`url(#clip-${clipId})`} transform={transform}>
        <path
          d="M2.5 6.5H5.5V13H2.5C2.36739 13 2.24021 12.9473 2.14645 12.8536C2.05268 12.7598 2 12.6326 2 12.5V7C2 6.86739 2.05268 6.74021 2.14645 6.64645C2.24021 6.55268 2.36739 6.5 2.5 6.5Z"
          stroke={color}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {filled && (
          <path
            d="M5.5 6.5L8 1.5C8.53043 1.5 9.03914 1.71071 9.41421 2.08579C9.78929 2.46086 10 2.96957 10 3.5V5H14C14.1419 5.00004 14.2821 5.03026 14.4113 5.08865C14.5406 5.14704 14.656 5.23227 14.7498 5.33867C14.8436 5.44507 14.9137 5.57021 14.9555 5.70579C14.9972 5.84136 15.0096 5.98426 14.9919 6.125L14.2419 12.125C14.2114 12.3666 14.0939 12.5888 13.9113 12.7499C13.7286 12.911 13.4935 12.9999 13.25 13H5.5"
            fill={color}
          />
        )}
        <path
          d="M5.5 6.5L8 1.5C8.53043 1.5 9.03914 1.71071 9.41421 2.08579C9.78929 2.46086 10 2.96957 10 3.5V5H14C14.1419 5.00004 14.2821 5.03026 14.4113 5.08865C14.5406 5.14704 14.656 5.23227 14.7498 5.33867C14.8436 5.44507 14.9137 5.57021 14.9555 5.70579C14.9972 5.84136 15.0096 5.98426 14.9919 6.125L14.2419 12.125C14.2114 12.3666 14.0939 12.5888 13.9113 12.7499C13.7286 12.911 13.4935 12.9999 13.25 13H5.5"
          stroke={color}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={`clip-${clipId}`}>
          <rect width="16" height="16" fill="white" transform="translate(0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

type LikeDislikeProps = {
  feedback?: 'like' | 'dislike' | null;
  leadingText?: string;
};

const FeedbackSection = ({ feedback, leadingText = 'How did you like this unit?' }: LikeDislikeProps) => {
  const [currentFeedback, setCurrentFeedback] = useState<LikeDislikeProps['feedback']>(feedback);

  return (
    <div className="inline-flex items-center gap-4 [--feedback-gray:#13132E]">
      <span className="text-size-xs text-(--feedback-gray)/60">{leadingText}</span>
      <div className="flex items-center gap-1">
        <CTALinkOrButton
          className={clsx(
            currentFeedback === 'like' && 'bg-[#0037FF]/6 text-[#2244BB] hover:bg-[#0037FF]/10 hover:text-[#2244BB]',
          )}
          variant="ghost"
          size="small"
          onClick={() => setCurrentFeedback(currentFeedback === 'like' ? null : 'like')}
        >
          <span className="flex items-center gap-1.5">
            <ThumbIcon filled={currentFeedback === 'like'} />
            Like
          </span>
        </CTALinkOrButton>
        <CTALinkOrButton
          className={clsx(
            currentFeedback === 'dislike'
              && 'bg-(--feedback-gray)/6 !text-(--feedback-gray) hover:bg-(--feedback-gray)/10',
          )}
          variant="ghost"
          size="small"
          onClick={() => setCurrentFeedback(currentFeedback === 'dislike' ? null : 'dislike')}
        >
          <span className="flex items-center gap-1.5">
            <ThumbIcon filled={currentFeedback === 'dislike'} isDislike />
            Dislike
          </span>
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default FeedbackSection;
