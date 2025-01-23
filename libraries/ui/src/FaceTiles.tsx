import React from 'react';

interface FaceTilesProps {
  faces: Array<{
    src: string;
    alt: string;
  }>;
  maxDisplay?: number;
  size?: number;
  className?: string;
}

export const FaceTiles: React.FC<FaceTilesProps> = ({
  faces,
  maxDisplay = 4,
  size = 40,
  className = '',
}) => {
  const displayFaces = faces.slice(0, maxDisplay);
  const remainingCount = Math.max(0, faces.length - maxDisplay);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-3">
        {displayFaces.map((face, index) => (
          <div
            key={index}
            className="rounded-full border-2 border-white overflow-hidden"
            style={{ width: size, height: size }}
          >
            <img
              src={face.src}
              alt={face.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm ml-1"
          style={{
            width: size + 16,
            height: size,
            fontSize: size * 0.35,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default FaceTiles;
