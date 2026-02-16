import React from 'react';

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
      {/* Play icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="0.625"
          y="0.625"
          width="14.75"
          height="14.75"
          rx="7.375"
          stroke="#6A6F7A"
          strokeWidth="1.25"
          className="group-hover:stroke-bluedot-navy transition-colors duration-200"
        />
        <path
          d="M6 10.4839V5.51675C6 5.13551 6.40956 4.89452 6.74282 5.07967L11.2133 7.56325C11.5562 7.75375 11.5562 8.2469 11.2133 8.4374L6.74282 10.921C6.40956 11.1061 6 10.8651 6 10.4839Z"
          fill="#6A6F7A"
          className="group-hover:fill-bluedot-navy transition-colors duration-200"
        />
      </svg>

      {/* Text */}
      <span className="text-[13px] font-medium leading-[140%] tracking-[-0.005em] text-[#6A6F7A] group-hover:text-bluedot-navy transition-colors duration-200">
        Listen to article
      </span>
    </button>
  );
};

export default ListenToArticleButton;
