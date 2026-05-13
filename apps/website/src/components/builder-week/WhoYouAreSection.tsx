import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const WhoYouAreSection = () => {
  return (
    <section className="section section-body builder-week-who-you-are-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Who you are</h3>
        <P>
          You believe that we need <em>way</em> more skilled, motivated people in AI safety if the future is to go well.
        </P>
        <P>
          You don&apos;t think of yourself as a &ldquo;field builder&rdquo;. Most of us don&apos;t.
        </P>
        <P>
          <strong>You&apos;re a problem-solver.</strong> You&apos;ve taken on challenges like this before. Maybe you started and scaled a student group, built a project people depend on, grew a community that outlasted you.
        </P>
        <P>
          <strong>You don&apos;t need a polished idea.</strong> But you have a whisper from conversations you&apos;ve had, an observation you keep making, something fleshed out from your experience breaking into the field.
        </P>
        <P>
          This is the sign you&apos;ve been waiting for. We&apos;re ready to back you.
        </P>
      </div>
    </section>
  );
};

export default WhoYouAreSection;
