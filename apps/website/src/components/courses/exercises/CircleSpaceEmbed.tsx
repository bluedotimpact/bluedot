import React, { CSSProperties } from 'react';

type CircleSpaceEmbedProps = {
  // Required
  spaceSlug: string;
  // Optional
  style?: CSSProperties;
};

const CircleSpaceEmbed: React.FC<CircleSpaceEmbedProps> = ({
  spaceSlug,
  style,
}) => {
  return (
    <iframe
      title={`Community discussion for ${spaceSlug}`}
      style={{
        border: '0',
        boxShadow: 'none',
        width: '800px',
        height: '80vh',
        ...style,
      }}
      src={`https://community.bluedot.org/c/${spaceSlug}?iframe=true`}
    />
  );
};

export default CircleSpaceEmbed;
