import {
  HeroSection,
  BluedotRoute,
  Breadcrumbs,
  HeroH2,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ROUTES } from '../lib/routes';

const overallSize = 600; // Overall size of the SVG
const staticCircleRadius = 60; // Radius of the static circle
const orbitRadiusMultiplier = 1.4; // Orbit radius as a multiple of the static circle's radius
const orbitRadius = staticCircleRadius * orbitRadiusMultiplier; // Calculated orbit radius

const numberOffsetX = 70; // Horizontal offset for numbers
const numberOffsetY = 225; // Vertical position for numbers
const numberSpacing = 80;

const Error404SVG = () => (
  <svg
    viewBox={`0 0 ${overallSize} ${overallSize / 2}`}
    xmlns="http://www.w3.org/2000/svg"
    className="select-none w-full h-full flex-1 text-[200px]"
  >
    {/* Number 4 on the left */}
    <text x={overallSize / 2 - orbitRadius - numberOffsetX - numberSpacing} y={numberOffsetY} fill="white">
      4
    </text>

    {/* Number 4 on the right */}
    <text x={overallSize / 2 + orbitRadius - numberOffsetX + numberSpacing} y={numberOffsetY} fill="white">
      4
    </text>

    {/* Behind circle */}
    <circle cx="60" cy="70" r="5" fill="white">
      <animate
        attributeName="cx"
        values={`${overallSize / 2 - orbitRadius};${overallSize / 2 + orbitRadius};${overallSize / 2 - orbitRadius}`}
        keyTimes="0;0.5;1"
        dur="2s"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        repeatCount="indefinite"
      />
      <animate
        attributeName="cy"
        values={`${overallSize / 4 + orbitRadius};${overallSize / 4 - orbitRadius};${overallSize / 4 + orbitRadius}`}
        keyTimes="0;0.5;1"
        dur="2s"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        repeatCount="indefinite"
      />
      <animate
        attributeName="visibility"
        dur="2s"
        values="visible;hidden"
        keyTimes="0;0.5"
        calcMode="discrete"
        repeatCount="indefinite"
      />
    </circle>

    {/* The large circle */}
    <circle
      cx={overallSize / 2}
      cy={overallSize / 4}
      r={staticCircleRadius}
      fill="#00114D"
      stroke="#003AFF"
      strokeWidth="14"
    />

    {/* Front circle */}
    <circle cx="60" cy="70" r="5" fill="white">
      <animate
        attributeName="cx"
        values={`${overallSize / 2 - orbitRadius};${overallSize / 2 + orbitRadius};${overallSize / 2 - orbitRadius}`}
        keyTimes="0;0.5;1"
        dur="2s"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        repeatCount="indefinite"
      />
      <animate
        attributeName="cy"
        values={`${overallSize / 4 + orbitRadius};${overallSize / 4 - orbitRadius};${overallSize / 4 + orbitRadius}`}
        keyTimes="0;0.5;1"
        dur="2s"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        repeatCount="indefinite"
      />
      <animate
        attributeName="visibility"
        dur="2s"
        values="hidden;visible"
        keyTimes="0;0.5"
        calcMode="discrete"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

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
        <title>{currentRoute.title} | BlueDot Impact</title>
      </Head>
      <HeroSection className="w-full">
        {/* <div className="flex justify-center items-center"> */}
        <Error404SVG />
        <HeroH2>Sorry, this page does not exist.</HeroH2>
        {/* </div> */}
      </HeroSection>
      <Breadcrumbs route={currentRoute} />
    </div>
  );
};

export default Error404Page;
