import { A, H3, P } from '@bluedot/ui';
import { useGrantApplicationUrl } from '../grants/useGrantApplicationUrl';

const WhoYouAreSection = () => {
  const applicationUrl = useGrantApplicationUrl('fieldbuilder-week');

  return (
    <section className="section section-body fieldbuilder-week-who-you-are-section">
      <div className="w-full max-w-prose flex flex-col gap-6">
        <H3>Who you are</H3>
        <P>
          You believe that we need <em>way</em> more skilled, motivated people in AI safety if the future is to go well.
        </P>
        <P>
          <strong>You&apos;ve built things.</strong> Maybe you started and scaled a student group, built a project people depend on, grew a community that outlasted you.
        </P>
        <P>
          <strong>You don&apos;t need a polished idea.</strong> But you&apos;ve noticed a gap from seeing talented, motivated people get stuck, or from your own attempts to contribute to AI safety.
        </P>
        <P>
          <strong>You may not think of yourself as a fieldbuilder.</strong> Not all of us did initially.
        </P>
        <P>
          If this sounds like you, {applicationUrl ? <A href={applicationUrl}>apply</A> : 'apply'}. We&apos;re ready to back you.
        </P>
      </div>
    </section>
  );
};

export default WhoYouAreSection;
