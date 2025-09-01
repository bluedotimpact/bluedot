import React, { CSSProperties } from 'react';

type CircleSpaceEmbedProps = {
  // Required
  spaceSlug: string;
  // Optional
  style?: CSSProperties;
};

// TODO: either remove this component, or create a new way to link to the community page.
// See https://github.com/bluedotimpact/bluedot/issues/1216#issuecomment-3236448706
const CircleSpaceEmbed: React.FC<CircleSpaceEmbedProps> = ({ spaceSlug, style }) => {
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
