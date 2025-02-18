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
// TODO WH: Pull this out into its own PR
export const withClickTracking = <P extends object>(
  WrappedComponent: React.ComponentType<WithClick<P>>,
  defaultConfig: TrackingConfig = { eventName: 'click', eventParams: {} },
) => {
  // Return wrapped component that accepts both original props and tracking props
  const ClickTrackingComponent = (
    props: WithClick<P> & TrackingProps,
  ) => {
    const {
      trackingEventName,
      trackingEventParams,
      onClick,
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

    const handleClick = (e: React.MouseEvent) => {
      sendGAEvent('event', eventConfig.eventName, eventConfig.eventParams);
      if (onClick) onClick(e);
    };

    return <WrappedComponent {...componentProps as P} onClick={handleClick} />;
  };
  return ClickTrackingComponent;
};
