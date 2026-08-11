import { CTALinkOrButton, H3, P } from '@bluedot/ui';

const InviteOnlySection = () => {
  return (
    <section className="section section-body advising-invite-only-section">
      <div className="w-full flex flex-col gap-6">
        <H3>1-1 advising is now by invitation</H3>

        <P>
          BlueDot supports the strongest people from our community to work on AI safety by connecting them to funding, programs, roles and collaborators. We can only hold a small number of calls at a time, so we invite people rather than reviewing applications.
        </P>

        <P>
          If we reach out, it&apos;s because something in your course application, your work, or your contributions in discussions stood out to us.
        </P>

        <div>
          <CTALinkOrButton variant="primary" withChevron url="/courses">
            Browse our courses
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default InviteOnlySection;
