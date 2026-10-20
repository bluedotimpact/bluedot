import { A, H3, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import TeamSize from '../shared/TeamSize';

const offers = [
  'Salaries benchmarked on SF tech salaries',
  '10% employer retirement contribution and health insurance',
  'Unlimited paid time off',
  'Yearly wellbeing and commute allowances',
  'Relocation support and US visa sponsorship',
] as const;

const WhyUsSection = () => {
  return (
    <section className="section section-body">
      <div className="flex flex-col gap-10">
        <div>
          <H3 className="mb-4">Why join us</H3>
          <div className="flex flex-col gap-4">
            <P>We&apos;re <TeamSize /> in San Francisco, London and remotely. We&apos;ve raised $71M, and we plan to grow to 50 people over the next 12 months.</P>
            <P>Join now and you&apos;ll help shape what BlueDot becomes. You might launch a course, give out grants, run an in-person program, or find a way to reach ten times more people.</P>
          </div>
        </div>

        <div>
          <H3 className="mb-4">How we work</H3>
          <P>We work in public, move fast on decisions that are easy to undo, and give each other direct feedback. Read <A href={`${ROUTES.about.url}#principles`}>our principles</A>.</P>
        </div>

        <div>
          <H3 className="mb-4">What we offer</H3>
          <ul className="flex flex-col gap-2 list-disc pl-5">
            {offers.map((offer) => (
              <li key={offer}><P>{offer}</P></li>
            ))}
            <li>
              <P>One expense rule: <A href="https://blog.bluedot.org/p/expenses">act in BlueDot&apos;s best interest</A></P>
            </li>
          </ul>
        </div>

        <div>
          <H3 className="mb-4">How we hire</H3>
          <P>Apply, do a paid work test, then an interview and an in-person work trial. Exceptional people can skip straight to the trial.</P>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
