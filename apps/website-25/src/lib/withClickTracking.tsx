import React from 'react';
import { sendGAEvent } from '@next/third-parties/google';

// Base tracking configuration type
interface TrackingConfig {
  eventName: string;
  eventParams?: Record<string, string>;
}

// Props that will be available on the wrapped component
interface TrackingProps {
  trackingEventName?: string;
  trackingEventParams?: Record<string, string>;
}

// Type helper to ensure wrapped component has onClick
type WithClick<P> = P & { onClick?: (e: React.MouseEvent) => void };

// HOC function
export const withClickTracking = <P extends object>(
  WrappedComponent: React.ComponentType<WithClick<P>>,
  defaultConfig: TrackingConfig = { eventName: 'click', eventParams: {} },
) => {
  // Return wrapped component that accepts both original props and tracking props
  const ClickTrackingComponent = (
    props: P & TrackingProps,
  ) => {
    const {
      trackingEventName,
      trackingEventParams,
      ...componentProps
    } = props;

    // Merge default config with props passed to the component
    const eventConfig = {
      eventName: trackingEventName || defaultConfig.eventName,
      eventParams: {
        ...defaultConfig.eventParams,
        ...trackingEventParams,
      },
    };

    const handleClick = () => {
      sendGAEvent('event', eventConfig.eventName, eventConfig.eventParams);
    };

    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    return <span onClick={handleClick}><WrappedComponent {...componentProps as P} /></span>;
  };
  return ClickTrackingComponent;
};
