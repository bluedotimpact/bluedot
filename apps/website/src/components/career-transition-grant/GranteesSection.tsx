import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';
import Link from 'next/link';
import { trpc } from '../../utils/trpc';

type GranteeCardProps = {
  name: string;
  bio: string;
  plan: string;
  imageUrl: string;
  profileUrl?: string | null;
};

const cardClass = 'group flex h-full flex-col rounded-lg border border-bluedot-navy/10 bg-white p-5 transition-colors hover:border-bluedot-navy/20';

const GranteeCard = ({ name, bio, plan, imageUrl, profileUrl }: GranteeCardProps) => {
  const cardContent = (
    <>
      <div className="flex items-center gap-4">
        <img
          src={imageUrl}
          alt=""
          className="size-14 rounded-full object-cover"
          loading="lazy"
        />
        <div className="flex min-w-0 flex-col">
          <h4 className="text-[16px] font-semibold leading-tight text-bluedot-navy">
            {name}
          </h4>
          {bio && (
            <p className="mt-1 text-[13px] leading-[1.4] text-bluedot-navy/68">
              {bio}
            </p>
          )}
        </div>
      </div>
      {plan && (
        <P className="mt-4 text-[14px] leading-[1.6] text-bluedot-navy/74">
          {plan}
        </P>
      )}
      {profileUrl && (
        <span className="mt-auto pt-4 text-[14px] font-medium text-bluedot-navy/68 transition-colors group-hover:text-bluedot-navy">
          View profile →
        </span>
      )}
    </>
  );

  if (profileUrl) {
    return <Link href={profileUrl} className={cardClass}>{cardContent}</Link>;
  }

  return <div className={cardClass}>{cardContent}</div>;
};

const GranteesSection = () => {
  const { data: grantees } = trpc.grants.getAllPublicCareerTransitionGrantees.useQuery();

  const visibleGrantees = grantees?.filter((g) => g.imageUrl) ?? [];

  if (visibleGrantees.length === 0) return null;

  return (
    <section className="section section-body career-transition-grant-grantees-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Some of our grantees</h3>
        <ul className="list-none grid gap-4 grid-cols-1 min-[680px]:grid-cols-2 min-[1120px]:grid-cols-3">
          {visibleGrantees.map((g) => (
            <li key={g.granteeName} className="h-full">
              <GranteeCard
                name={g.granteeName}
                bio={g.bio ?? ''}
                plan={g.grantPlan ?? ''}
                imageUrl={g.imageUrl!}
                profileUrl={g.profileUrl}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default GranteesSection;
