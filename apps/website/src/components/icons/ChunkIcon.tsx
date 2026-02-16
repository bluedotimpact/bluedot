import type React from 'react';

type ChunkIconProps = {
  isActive?: boolean;
  fill?: string;
  activeStroke?: string;
  inactiveStroke?: string;
  size?: number;
};

export const ChunkIcon: React.FC<ChunkIconProps> = ({
  isActive,
  fill = 'var(--bluedot-navy)',
  activeStroke = 'var(--bluedot-navy)',
  inactiveStroke = 'rgba(106,111,122,0.3)',
  size = 24,
}) => {
  if (isActive) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1Z"
          stroke={activeStroke}
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="5" fill={fill} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1Z"
        stroke={inactiveStroke}
        strokeWidth="2"
      />
    </svg>
  );
};
