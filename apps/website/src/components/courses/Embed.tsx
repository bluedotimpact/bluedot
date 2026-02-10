import clsx from 'clsx';
import type React from 'react';

type EmbedProps = {
  url: string;
  className?: string;
};

const Embed: React.FC<EmbedProps> = ({
  url,
  className,
}) => {
  const isYouTube = url.startsWith('https://www.youtube.com/') || url.startsWith('https://www.youtube-nocookie.com/');
  const isImage = url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.webp') || url.endsWith('.svg');

  // Check if it's any Suno URL
  const isSuno = url.includes('suno.com/') || url.includes('suno.ai/');

  // For any Suno URL, always use audio element (no iframe in production)
  if (isSuno) {
    let audioUrl = url;

    // Extract song ID from various Suno URL formats
    const songIdMatch = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i.exec(url);
    if (songIdMatch) {
      const songId = songIdMatch[1];
      // Corrected the URL string interpolation
      audioUrl = `https://cdn1.suno.ai/${songId}.mp3`;
    }

    return (
      <div className={clsx('embed rounded-xl bg-gray-100 shadow-md flex flex-col min-h-fit', className)}>
        <div className="p-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-size-lg font-semibold text-gray-800">Suno AI Music</h3>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-size-sm text-gray-600 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
              >
                AI-generated music from Suno
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <audio
            controls
            className="w-full block"
            preload="metadata"
          >
            <source src={audioUrl} type="audio/mpeg" />
            <track kind="captions" src="" label="No captions available" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );
  }

  return (
    isImage ? (
      <img src={url} alt="" className={clsx('embed rounded-lg', className)} />
    ) : (

      <iframe
        src={isYouTube ? `${url.replace('https://www.youtube.com/', 'https://www.youtube-nocookie.com/')}${url.includes('?') ? '&rel=0' : '?rel=0'}` : url}
        // Width and height should be overriden in css
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        className={clsx('embed rounded-lg', isYouTube ? 'aspect-video h-auto' : 'min-h-[450px]', className)}
      />
    )
  );
};

export default Embed;
