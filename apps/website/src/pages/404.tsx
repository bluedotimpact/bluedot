import {
  HeroSection,
  type BluedotRoute,
  Breadcrumbs,
  HeroH2,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Rive, { Fit, Layout } from '@rive-app/react-canvas';
import { ROUTES } from '../lib/routes';

const Error404Page = () => {
  const router = useRouter();
  const currentRoute: BluedotRoute = {
    title: 'Error 404',
    url: router.asPath,
    parentPages: [ROUTES.home],
  };

  return (
    <div>
      <Head>
        <title>{`${currentRoute.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <HeroSection className="404-hero overflow-hidden">
        {/* The background on the Rive animation slightly mismatches the HeroSection
            background. The box-shadow here is to blend the two together */}
        <div
          className="404-hero__animation-container w-[400px] max-w-[80vw] aspect-2/1 shadow-[0_0_120px_120px_#011664]"
        >
          <Rive
            src="/animations/herobluedot_hero.riv"
            artboard="404"
            layout={new Layout({ fit: Fit.Fill })}
          />
        </div>
        <HeroH2>Sorry, this page does not exist.</HeroH2>
      </HeroSection>
      <Breadcrumbs route={currentRoute} />
    </div>
  );
};

export default Error404Page;
