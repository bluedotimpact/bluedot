import type React from 'react';
import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import MyBlueDotSidebar from './MyBlueDotSidebar';

type MyBlueDotLayoutProps = {
  children: React.ReactNode;
  route: BluedotRoute;
  afterBreadcrumbs?: React.ReactNode;
};

const MyBlueDotLayout = ({ children, route, afterBreadcrumbs }: MyBlueDotLayoutProps) => (
  <>
    <Breadcrumbs route={route} />
    {afterBreadcrumbs}

    <div className="section-base py-8">
      <div className="lg:flex lg:gap-8">
        <MyBlueDotSidebar />
        <section className="min-w-0 flex-1" aria-label="My BlueDot content">
          {children}
        </section>
      </div>
    </div>
  </>
);

export default MyBlueDotLayout;
