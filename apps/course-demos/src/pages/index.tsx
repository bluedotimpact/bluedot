import {
  CTALinkOrButton, NewText,
} from '@bluedot/ui';

const HomePage = () => {
  return (
    <div className="section-body gap-2">
      <NewText.H1>course-demos</NewText.H1>
      <NewText.P>This site contains demos that BlueDot Impact uses on our courses</NewText.P>
      <CTALinkOrButton url="https://bluedot.org" withChevron className="mt-4">Learn more about our courses</CTALinkOrButton>
    </div>
  );
};

export default HomePage;
