import { useCallback, useEffect, useState } from 'react';
import {
  CTALinkOrButton, H1, A,
} from '@bluedot/ui';
import { type PageState } from '../lib/client/pageState';
import { Page } from './Page';

export type AppJoinViewProps = {
  page: PageState & { name: 'appJoin' };
};

const AppJoinView: React.FC<AppJoinViewProps> = ({
  page: {
    meetingNumber, meetingPassword, meetingHostKey, activityDoc,
  },
}) => {
  const [secondsToOpen, setSecondsToOpen] = useState(meetingHostKey ? 5 : 0);
  const joinDirect = useCallback(() => {
    window.open(`zoomus://zoom.us/join?action=join&confno=${meetingNumber}&pwd=${meetingPassword}`, '_self');
  }, [meetingNumber, meetingPassword]);

  useEffect(() => {
    if (secondsToOpen <= 0) {
      joinDirect();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsToOpen((s) => s - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [joinDirect, secondsToOpen]);

  const meetingHostKeyMessage = meetingHostKey ? (
    <>
      <p>To manage breakout rooms, use the host key: <span className="select-all font-bold text-3xl">{meetingHostKey}</span></p>
      <p className="mb-4">(Enter this in the 'Participants' window, using the 'Claim Host' button)</p>
    </>
  ) : null;

  return (
    <Page>
      <H1 className="mb-4">{secondsToOpen <= 0 ? 'Enjoy your meeting!' : `Joining your meeting in ${secondsToOpen}...`}</H1>
      {meetingHostKeyMessage}
      <CTALinkOrButton onClick={() => joinDirect()}>Join now</CTALinkOrButton>
      {activityDoc && (
        <CTALinkOrButton
          className="mt-2"
          variant="secondary"
          url={activityDoc}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Discussion Doc
        </CTALinkOrButton>
      )}
      {secondsToOpen <= 0 && (
        <p className="mt-4">Button doesn't work? <A href={`https://zoom.us/j/${meetingNumber}?pwd=${meetingPassword}`} className="underline">Join via Zoom website</A></p>
      ) }
    </Page>
  );
};

export default AppJoinView;
