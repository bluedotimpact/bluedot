import {
  Button, LegacyText,
} from '@bluedot/ui';

const HomePage = () => {
  return (
    <div className="mx-8">
      <LegacyText.H1>course-demos</LegacyText.H1>
      <LegacyText.P>This site contains demos we use on our courses</LegacyText.P>
      <Button url="https://bluedot.org">Learn more about our courses</Button>
    </div>
  );
};

export default HomePage;
