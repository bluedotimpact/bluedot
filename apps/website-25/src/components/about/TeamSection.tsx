import { Section } from '@bluedot/ui';

const TeamSection = () => {
  return (
    <Section className="team-section" title="Our team">
      <div className="team-section__container flex flex-row flex-wrap mt-16 gap-4">
        <TeamMember name="Adam Jones" title="AI Safety" image="/images/team/adam.jpg" profileUrl="https://www.linkedin.com/in/domdomegg/" />
        <TeamMember name="Dewi Erwan" title="CEO" image="/images/team/dewi.jpg" profileUrl="https://www.linkedin.com/in/dewierwan/" />
        <TeamMember name="Josh Landes" title="Community Manager" image="/images/team/josh.jpg" profileUrl="https://www.linkedin.com/in/josh-landes12/" />
        <TeamMember name="Li-Lian Ang" title="Product" image="/images/team/lilian.jpg" profileUrl="https://www.linkedin.com/in/anglilian/" />
        <TeamMember name="Tarin Rickett" title="Engineering" image="/images/team/tarin.jpg" profileUrl="https://www.linkedin.com/in/tarin-rickett/" />
        <TeamMember name="Viorica  Gheroghita" title="Product" image="/images/team/vio.jpg" profileUrl="https://www.linkedin.com/in/vioricagheorghita/" />
        <TeamMember name="Will Saunter" title="Co-founder" image="/images/team/will.jpg" profileUrl="https://www.linkedin.com/in/will-saunter/" />
      </div>
    </Section>
  );
};

const TeamMember = ({
  name, title, image, profileUrl,
}: { name: string, title: string, image?: string, profileUrl?: string }) => {
  return (
    <div className="team-member pb-6 w-[323px]">
      <img src={image || '/images/team/tarin.jpg'} alt="Course Card Placeholder" className="team-member__image w-full h-[223px] object-cover rounded-xl mb-3" />
      <h2 className="team-member__name">{name}</h2>
      <p className="team-member__title mb-4">{title}</p>
      <div className="team-member__links flex justify-between items-center">
        {profileUrl && (
          <a
            href={profileUrl}
            className="team-member__link text-center text-xs text-bluedot-normal border border-bluedot-normal rounded-lg px-4 py-2 font-semibold"
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
};

export default TeamSection;
