import type React from 'react';

export type FaceTilesProps = {
  faces: {
    src: string;
    alt: string;
  }[];
  maxDisplay?: number;
  size?: number;
  className?: string;
};

export const FaceTiles: React.FC<FaceTilesProps> = ({
  faces,
  maxDisplay = 4,
  size = 32,
  className = '',
}) => {
  const displayFaces = faces.slice(0, maxDisplay);
  // TODO: Both of these should be fetched from the backend in the future
  const remainingCount = 4000;

  return (
    <div className={`face-tiles flex items-center ${className}`}>
      <div className="face-tiles__container flex -space-x-3">
        {displayFaces.map((face) => (
          <div
            key={face.src}
            className="face-tiles__avatar rounded-full border border-white overflow-hidden"
            style={{ width: size, height: size }}
          >
            <img
              src={face.src}
              alt={face.alt}
              className="face-tiles__avatar-img size-full object-cover"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="face-tiles__counter flex items-center justify-center bg-bluedot-lighter text-bluedot-normal font-semibold text-size-xs border border-bluedot-normal w-[66px] h-8 rounded-2xl px-2 py-4"
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceTiles;
