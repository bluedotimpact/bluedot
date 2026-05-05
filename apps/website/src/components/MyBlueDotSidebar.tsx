import { ClickTarget, P } from '@bluedot/ui';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { label: 'My Courses', href: '/my-courses' },
  { label: 'Account', href: '/account' },
];

const MyBlueDotSidebar = () => {
  const router = useRouter();

  return (
    <aside className="lg:col-span-3 mb-6 lg:max-w-[320px]" aria-label="My BlueDot navigation">
      <p className="text-xs font-semibold tracking-widest uppercase text-bluedot-normal mb-3 px-3">
        My BlueDot
      </p>
      <nav>
        <ul className="flex gap-2 flex-wrap lg:block lg:space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <li key={item.href}>
                <ClickTarget
                  url={item.href}
                  className={`
                    w-auto lg:w-full h-11 px-4 py-3 rounded-lg transition-colors flex items-center
                    ${isActive
                ? 'bg-[rgba(0,85,255,0.08)] text-bluedot-darker font-semibold'
                : 'text-bluedot-darker hover:bg-[rgba(0,85,255,0.04)]'
              }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex items-center gap-3 w-full">
                    <P className={`text-size-xs leading-[22px] flex-grow !m-0 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                      {item.label}
                    </P>
                  </span>
                </ClickTarget>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default MyBlueDotSidebar;
