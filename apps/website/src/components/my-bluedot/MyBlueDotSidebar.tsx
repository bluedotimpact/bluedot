import { ClickTarget } from '@bluedot/ui';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  // TODO Facilitated Courses
  { label: 'My Courses', href: '/my-courses' },
  { label: 'Account', href: '/account' },
];

const ITEM_HEIGHT_PX = 44;

const MyBlueDotSidebar = () => {
  const router = useRouter();
  const activeIndex = NAV_ITEMS.findIndex((item) => router.pathname === item.href);

  return (
    <nav
      className="hidden w-[200px] shrink-0 lg:block"
      aria-labelledby="my-bluedot-nav-label"
    >
      <p
        id="my-bluedot-nav-label"
        className="mb-4 text-size-xxs font-semibold uppercase tracking-wide text-bluedot-normal"
      >
        My BlueDot
      </p>
      <div className="relative">
        <div aria-hidden className="absolute bottom-0 left-0 top-0 w-1 bg-color-divider" />
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-11 w-1 bg-bluedot-normal transition-transform duration-200 ease-out"
            style={{ transform: `translateY(${activeIndex * ITEM_HEIGHT_PX}px)` }}
          />
        )}
        <ul className="flex flex-col">
          {NAV_ITEMS.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <li key={item.href}>
                <ClickTarget
                  url={item.href}
                  className="flex h-11 items-center rounded-md pl-5 transition-colors hover:bg-bluedot-normal/5"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`text-size-sm leading-6 transition-colors ${isActive ? 'text-bluedot-normal' : 'text-bluedot-navy'}`}>
                    {item.label}
                  </span>
                </ClickTarget>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default MyBlueDotSidebar;
