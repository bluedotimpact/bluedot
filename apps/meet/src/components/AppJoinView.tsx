import { useEffect, useState } from 'react';
import { Button, Link } from '@bluedot/ui';
import { PageState } from '../lib/client/pageState';
import { Page } from './Page';
import { H1 } from './Text';

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
        <div className="flex">
          <H1 className="flex-1">Enjoy your meeting!</H1>
        </div>
        {meetingHostKeyMessage}
        <Button onPress={() => joinDirect()}>Join now</Button>
        <p className="mt-4">Button doesn't work? <Link url={`https://zoom.us/j/${meetingNumber}?pwd=${meetingPassword}`} className="underline">Join via Zoom website</Link></p>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex">
        <H1 className="flex-1">Joining your meeting in {secondsToOpen}...</H1>
      </div>
      {meetingHostKeyMessage}
      <Button onPress={() => setSecondsToOpen(0)}>Join now</Button>
    </Page>
  );
};

export default AppJoinView;
