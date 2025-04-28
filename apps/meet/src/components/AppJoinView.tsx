import { useEffect, useState } from 'react';
import {
  CTALinkOrButton, NewText,
} from '@bluedot/ui';
import { PageState } from '../lib/client/pageState';
import { Page } from './Page';

export type AppJoinViewProps = {
  page: PageState & { name: 'appJoin' },
};

const AppJoinView: React.FC<AppJoinViewProps> = ({ page: { meetingNumber, meetingPassword, meetingHostKey } }) => {
  const [secondsToOpen, setSecondsToOpen] = useState(meetingHostKey ? 5 : 0);
  const joinDirect = () => {
    window.open(`zoomus://zoom.us/join?action=join&confno=${meetingNumber}&pwd=${meetingPassword}`, '_self');
  };

  useEffect(() => {
    if (secondsToOpen <= 0) {
      joinDirect();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsToOpen((s) => s - 1);
    }, 1000);
    // eslint-disable-next-line consistent-return
    return () => clearTimeout(timer);
  }, [secondsToOpen]);

  const meetingHostKeyMessage = meetingHostKey ? (
    <>
      <p>To manage breakout rooms, use the host key: <span className="select-all font-bold text-3xl">{meetingHostKey}</span></p>
      <p className="mb-4">(Enter this in the 'Participants' window, using the 'Claim Host' button)</p>
    </>
  ) : null;

  if (secondsToOpen <= 0) {
    return (
      <Page>
        <NewText.H1 className="mb-4">Enjoy your meeting!</NewText.H1>
        {meetingHostKeyMessage}
        <CTALinkOrButton onClick={() => joinDirect()}>Join now</CTALinkOrButton>
        <p className="mt-4">Button doesn't work? <NewText.A href={`https://zoom.us/j/${meetingNumber}?pwd=${meetingPassword}`} className="underline">Join via Zoom website</NewText.A></p>
      </Page>
    );
  }

  return (
    <Page>
      <NewText.H1 className="mb-4">Joining your meeting in {secondsToOpen}...</NewText.H1>
      {meetingHostKeyMessage}
      <CTALinkOrButton onClick={() => setSecondsToOpen(0)}>Join now</CTALinkOrButton>
    </Page>
  );
};

export default AppJoinView;
