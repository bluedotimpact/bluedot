import type { ZoomMtg as ZoomMtgType } from '@zoom/meetingsdk';
import Script from 'next/script';
import Head from 'next/head';
import env from '../lib/client/env';
import { PageState } from '../lib/client/pageState';

type MeetingViewProps = {
  page: PageState & { name: 'room' }
};

export const ZOOM_VERSION = '3.8.5';

declare let ZoomMtg: typeof ZoomMtgType;

const MeetingView: React.FC<MeetingViewProps> = ({
  page: {
    jwt, participantName, meetingNumber, meetingPassword,
  },
}) => {
  // This setup is based on the guide at:
  // https://developers.zoom.us/docs/meeting-sdk/web/client-view/import/#init-the-meeting-sdk
  const onZoomLoad = () => {
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();

    ZoomMtg.init({
      disablePreview: true,
      disableInvite: true,
      defaultView: 'gallery',
      leaveUrl: `/finished${window.location.search}`,
      success: () => {
        ZoomMtg.join({
          sdkKey: env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
          signature: jwt,
          userName: participantName,
          meetingNumber,
          passWord: meetingPassword,
          success: () => {
            console.log('Joined meeting successfully');
          },
          error: (error: unknown) => {
            console.log('Error joining meeting', error);
          },
        });
      },
      error: (error: unknown) => {
        console.log('Error initializing Zoom client', error);
      },
    });
  };

  return (
    <div>
      {/* Scripts */}
      <Script src={`https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/react.min.js`} async={false} />
      <Script src={`https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/react-dom.min.js`} async={false} />
      <Script src={`https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/redux.min.js`} async={false} />
      <Script src={`https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/redux-thunk.min.js`} async={false} />
      <Script src={`https://source.zoom.us/${ZOOM_VERSION}/lib/vendor/lodash.min.js`} async={false} />
      <Script src={`https://source.zoom.us/zoom-meeting-${ZOOM_VERSION}.min.js`} async={false} onLoad={onZoomLoad} />

      {/* Styles */}
      <Head>
        <link key="zoom-bootstrap" type="text/css" rel="stylesheet" href={`https://source.zoom.us/${ZOOM_VERSION}/css/bootstrap.css`} />
        <link key="zoom-react-select" type="text/css" rel="stylesheet" href={`https://source.zoom.us/${ZOOM_VERSION}/css/react-select.css`} />
      </Head>
    </div>
  );
};

export default MeetingView;
