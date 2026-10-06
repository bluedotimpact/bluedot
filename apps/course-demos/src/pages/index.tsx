import {
  CTALinkOrButton, H1, P,
} from '@bluedot/ui';
import { FaChevronRight } from 'react-icons/fa6';

const HomePage = () => {
  return (
    <div className="section-body gap-2">
      <H1>course-demos</H1>
      <P>This site contains demos that BlueDot Impact uses on our courses</P>
      <CTALinkOrButton url="https://bluedot.org" className="mt-4">Learn more about our courses <FaChevronRight aria-hidden className="size-4" /></CTALinkOrButton>
    </div>
  );
};

export default HomePage;
