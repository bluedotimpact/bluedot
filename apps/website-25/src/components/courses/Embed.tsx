import clsx from 'clsx';
import React from 'react';

type EmbedProps = {
  url: string;
  className?: string;
};

const Embed: React.FC<EmbedProps> = ({
  url,
  className,
}) => {
  const isYouTube = url.startsWith('https://www.youtube.com/') || url.startsWith('https://www.youtube-nocookie.com/');

  return (
    // eslint-disable-next-line jsx-a11y/iframe-has-title
    <iframe
      src={isYouTube ? url.replace('https://www.youtube.com/', 'https://www.youtube-nocookie.com/') : url}
      // Width and height should be overriden in css
      width="100%"
      height="100%"
      frameBorder="0"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      className={clsx('embed rounded-lg', isYouTube ? 'aspect-video h-auto' : 'h-[450px]', className)}
    />
  );
};

export default Embed;
