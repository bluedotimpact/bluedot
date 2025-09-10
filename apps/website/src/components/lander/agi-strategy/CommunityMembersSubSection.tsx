import { SectionHeading } from '@bluedot/ui';

export type CommunityMember = {
  name: string;
  jobTitle: string;
  course: string;
  imageSrc: string;
};

type CommunityMembersSubSectionProps = {
  members: CommunityMember[];
  title?: string;
};

// Community Member Card Component
const CommunityMemberCard = ({ member }: { member: CommunityMember }) => (
  <div className="community-member flex flex-col h-full border border-[#E7E5E4] rounded-lg p-8 bg-white gap-6">
    <div className="community-member__content flex-grow flex flex-col justify-center items-center text-center gap-4">
      <div className="community-member__avatar size-32 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={member.imageSrc}
          alt={member.name}
          className="size-full object-cover"
        />
      </div>
      <div className="community-member__info flex flex-col gap-2">
        <div className="community-member__name font-semibold text-size-base leading-normal text-[#13132E]">
          {member.name}
        </div>
        <div className="community-member__job-title text-size-sm leading-[1.4] text-[#13132E] opacity-80">
          {member.jobTitle}
        </div>
        <div className="community-member__course text-size-xs leading-[20px] text-[#13132E] opacity-70 font-medium">
          {member.course}
        </div>
      </div>
    </div>
  </div>
);

const CommunityMembersSubSection = ({
  members,
  title,
}: CommunityMembersSubSectionProps) => {
  return (
    <div className="community-members-section w-full" data-testid="community-members-section">
      {title && <SectionHeading title={title} titleLevel="h3" className="community-members-section__heading" />}

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <CommunityMemberCard key={member.name} member={member} />
        ))}
      </div>
    </div>
  );
};

export default CommunityMembersSubSection;
