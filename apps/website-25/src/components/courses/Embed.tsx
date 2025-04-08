import clsx from 'clsx';
import React from 'react';

type EmbedProps = {
  url: string;
  width?: string;
  height?: string;
  className?: string;
};

const Embed: React.FC<EmbedProps> = ({
  url,
  width = '100%',
  height = '600px',
  className,
}) => {
  const isYouTube = url.startsWith('https://www.youtube.com/') || url.startsWith('https://www.youtube-nocookie.com/');

  return (
    // eslint-disable-next-line jsx-a11y/iframe-has-title
    <iframe
      src={isYouTube ? url.replace('https://www.youtube.com/', 'https://www.youtube-nocookie.com/') : url}
      width={width}
      height={isYouTube ? '100%' : height}
      frameBorder="0"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      className={clsx('embed w-full', isYouTube && 'aspect-video', className)}
    />
  );
};

export default Embed;
