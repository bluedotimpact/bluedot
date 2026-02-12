import type React from 'react';
import { sendGAEvent } from '@next/third-parties/google';

// Base tracking configuration type
type TrackingConfig = {
  eventName: string;
  eventParams?: Record<string, string>;
};

// Props that will be available on the wrapped component
type TrackingProps = {
  trackingEventName?: string;
  trackingEventParams?: Record<string, string>;
};

// HOC function
export const withClickTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  defaultConfig: TrackingConfig = { eventName: 'click', eventParams: {} },
) => {
  // Return wrapped component that accepts both original props and tracking props
  const ClickTrackingComponent = (props: P & TrackingProps) => {
    const {
      trackingEventName,
      trackingEventParams,
      ...componentProps
    } = props;

    // Merge default config with props passed to the component
    const eventConfig = {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      eventName: trackingEventName || defaultConfig.eventName,
      eventParams: {
        ...defaultConfig.eventParams,
        ...trackingEventParams,
      },
    };

    const handleClick = () => {
      sendGAEvent('event', eventConfig.eventName, eventConfig.eventParams);
    };

    return <span onClick={handleClick}><WrappedComponent {...componentProps as P} /></span>;
  };

  return ClickTrackingComponent;
};
