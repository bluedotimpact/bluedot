import {
  Button, H1, P,
} from '@bluedot/ui';

const HomePage = () => {
  return (
    <div className="mx-8">
      <H1>course-demos</H1>
      <P>This site contains demos we use on our courses</P>
      <Button url="https://bluedot.org">Learn more about our courses</Button>
    </div>
  );
};

export default HomePage;
