import type React from 'react';
import { PlayCircleIcon } from '../icons';

type ListenToArticleButtonProps = {
  audioUrl: string;
  resourceTitle: string;
};

const ListenToArticleButton: React.FC<ListenToArticleButtonProps> = ({ audioUrl, resourceTitle }) => {
  const handleClick = () => {
    // Open Spotify URL in new tab
    window.open(audioUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-row items-center gap-1.5 h-[18px] group cursor-pointer transition-colors duration-200 bg-transparent border-none p-0"
      aria-label={`Listen to article: ${resourceTitle} (opens in Spotify)`}
      type="button"
    >
      <PlayCircleIcon aria-hidden="true" className="group-hover:text-bluedot-navy transition-colors duration-200" />

      {/* Text */}
      <span className="text-size-xs font-medium leading-[140%] tracking-[-0.005em] text-[#6A6F7A] group-hover:text-bluedot-navy transition-colors duration-200">
        Listen to article
      </span>
    </button>
  );
};

export default ListenToArticleButton;
