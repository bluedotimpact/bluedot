import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { label: 'My Courses', href: '/settings-v2/courses' },
  { label: 'Applications', href: '/settings-v2/applications' },
  { label: 'Account', href: '/settings-v2/account' },
];

const MyBlueDotSidebarV2 = () => {
  const router = useRouter();

  return (
    <aside aria-label="My BlueDot navigation" className="w-56 shrink-0">
      <p className="text-xs font-semibold tracking-widest uppercase text-bluedot-normal mb-3 px-3">
        My BlueDot
      </p>
      <ul className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-3 py-2 text-sm border-l-2 transition-colors ${
                  isActive
                    ? 'border-bluedot-normal text-bluedot-darker font-semibold'
                    : 'border-transparent text-bluedot-darker hover:bg-bluedot-navy/5'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default MyBlueDotSidebarV2;
