import { CTALinkOrButton, NewText } from '@bluedot/ui';
import { useLayoutEffect, useState } from 'react';
import { FaArrowRightLong } from 'react-icons/fa6';

const HomePage = () => {
  const [brand, setBrand] = useState({
    name: 'AI Safety Fundamentals',
    icon: '/aisf-icon.png',
  });
  const [path, setPath] = useState('/');

  useLayoutEffect(() => {
    if (window.location.host === 'biosecurityfundamentals.com') {
      setBrand({
        name: 'Biosecurity Fundamentals',
        icon: '/bsf-icon.png',
      });
    }

    setPath(window.location.pathname + window.location.search);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-bluedot-normal to-bluedot-dark">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <div className="flex gap-4 items-center">
                <img
                  src={brand.icon}
                  alt={`${brand.name} logo`}
                  className="size-32 rounded-lg"
                />
                <FaArrowRightLong className="size-12 text-gray-400" />
                <img
                  src="/bluedot-icon.png"
                  alt="BlueDot Impact logo"
                  className="size-32 rounded-lg"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              We're consolidating our websites
            </h1>

            <NewText.P className="text-size-md text-gray-600 mb-6">
              {brand.name} is a program by BlueDot Impact. We've now merged our separate program websites into a single BlueDot Impact platform to provide a more integrated and consistent experience across our courses.
            </NewText.P>

            <div className="flex justify-center">
              <CTALinkOrButton withChevron url={`https://bluedot.org${path}`}>
                View this page on the new BlueDot Impact platform
              </CTALinkOrButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
