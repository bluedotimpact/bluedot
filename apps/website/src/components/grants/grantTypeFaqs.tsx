import type { FAQItem } from '../lander/components/FAQSection';
import type { GrantTypeSlug } from '../../lib/grantTypes';
import { FUNDING_RESTRICTIONS_FAQ } from './fundingRestrictions';

export const GRANT_TYPE_FAQS: Record<GrantTypeSlug, FAQItem[]> = {
  rapid: [
    {
      id: 'unsure',
      question: 'Should I apply if I\'m not sure it\'s a fit?',
      answer: 'Yes. Tell us what you want to do and what funding would make possible. You can apply for time to explore or begin something new, as well as support for work already underway.',
    },
    {
      id: 'eligibility',
      question: 'Who is eligible?',
      answer: (
        <>
          People taking a promising next step in AI safety or biosecurity, subject to our funding restrictions.
          <br />
          <br />
          You're more likely to receive a grant if you're a BlueDot course participant, alumni, facilitator, or active member of the AI safety/biosecurity community.
        </>
      ),
      answerText: 'People taking a promising next step in AI safety or biosecurity, subject to our funding restrictions. You\'re more likely to receive a grant if you\'re a BlueDot course participant, alumni, facilitator, or active member of the AI safety/biosecurity community.',
    },
    FUNDING_RESTRICTIONS_FAQ,
    {
      id: 'excluded-activities',
      question: 'What can a Rapid Grant not fund?',
      answer: 'Rapid Grants cannot be used for party-political donations or campaigning, activities that are unlawful in the UK or your jurisdiction, or activities outside BlueDot’s charitable or educational purposes. Funds must be used for the agreed purpose; material changes need our prior written approval.',
    },
    {
      id: 'events',
      question: 'Can Rapid Grants fund events or meetups?',
      answer: 'Yes. We have funded meetup series, venue costs, and community events in multiple countries. Show us the plan and the specific costs.',
    },
    {
      id: 'reimbursement',
      question: 'How is the grant paid?',
      answer: 'The grant is paid as a single lump sum after you submit a claim through our claims portal and we complete any required checks. Your acceptance email sets out the timing. Transfer fees and exchange costs may reduce the amount you receive.',
    },
    {
      id: 'travel',
      question: 'Can Rapid Grants cover travel?',
      answer: 'Yes. We fund travel for conferences, collaboration, and fieldwork. Show us why being there matters for the work.',
    },
    {
      id: 'after-receiving',
      question: 'What do I need to do after receiving a grant?',
      answer: 'Use the funding for the agreed purpose and get our written approval before making material changes. Send a short completion report within 60 days of finishing the work or the grant period ending.',
    },
    {
      id: 'community',
      question: 'What support is available beyond the grant?',
      answer: 'Grantees join our community: intros, event invites, and follow-on opportunities as they come up.',
    },
    {
      id: 'larger-request',
      question: 'What if I need more than a few thousand dollars?',
      answer: 'Rapid Grants offer up to $20,000. If you need more, get in touch. We can sometimes route you through another program.',
    },
  ],
  'career-transition': [
    {
      id: 'eligibility',
      question: 'Who should apply?',
      answer: (
        <>
          <span className="block mb-3">Apply if you:</span>
          <span className="block mb-2">• Are ready to work full-time on a personal transition</span>
          <span className="block mb-2">• Can point to evidence of relevant ability or recent momentum</span>
          <span className="block mb-2">• Have a plausible plan for producing work, testing a path or moving into a contribution</span>
          <span className="block mb-2">• Can explain how success could contribute to reducing catastrophic risks from advanced AI or biological threats</span>
          <span className="block mb-4">• Believe funding would meaningfully improve the transition</span>
          <span className="block">Prior participation in a BlueDot course or community is not required. Our funding restrictions apply.</span>
        </>
      ),
      answerText: 'Apply if you are ready to work full-time on a personal transition, can point to evidence of relevant ability or recent momentum, have a plausible plan for producing work, testing a path or moving into a contribution, can explain how success could contribute to reducing catastrophic risks from advanced AI or biological threats, and believe funding would meaningfully improve the transition. Prior participation in a BlueDot course or community is not required. Our funding restrictions apply.',
    },
    FUNDING_RESTRICTIONS_FAQ,
    {
      id: 'funding-need',
      question: 'Do I need to be unable to transition without funding?',
      answer: 'No. We do not require the transition to be literally impossible without BlueDot. We do want to understand what funding would change—for example, whether it lets you begin sooner, work full-time, take a more ambitious path or produce stronger evidence before making your next career decision.',
    },
    {
      id: 'work-sample',
      question: 'Do I need an AI safety work sample?',
      answer: 'Relevant AI safety or biosecurity work is the most useful evidence, but strong analogous work can also be informative. If you do not yet have a work sample, you may still apply; explain what other evidence we should use to assess your ability.',
    },
    {
      id: 'rapid-grants',
      question: 'Should I apply to Rapid Grants instead?',
      answer: 'Rapid Grants offer up to $20,000 for useful work or exploration, including your time, living costs and other resources. Career Transition Grants generally start at $20,000 and offer up to $200,000 for a sustained, full-time personal transition. For requests under $20,000, apply to Rapid Grants. If you are unsure, apply to the route that seems closest and we can redirect you.',
    },
    {
      id: 'uncertain',
      question: 'Should I apply if I don\'t know exactly how to contribute to AI safety yet?',
      answer: 'Yes. We do not expect a fixed career plan or certainty about every step. We do expect a serious hypothesis, a way to test it and a plan that can produce useful work or information even if the original path does not work.',
    },
    {
      id: 'circumstances-change',
      question: 'What if I secure a full-time role or my circumstances change during the grant?',
      answer: 'Please let us know. Any remaining funds would be returned to BlueDot.',
    },
    {
      id: 'masters-phd',
      question: 'Will you fund a Master\'s or PhD?',
      answer: 'Generally, no. For most people, a Master\'s or PhD isn\'t the most direct route to impactful AI safety or biosecurity work. There are exceptions. Mention it in your application if you think yours is one.',
    },
    {
      id: 'grant-structure',
      question: 'How is the grant structured?',
      answer: (
        <>
          The grant is a fellowship grant in support of your AI safety or biosecurity transition. It is not a salary or a contract for services. BlueDot is a UK entity, so we don't issue W-2s or 1099s, and the agreement explicitly states there is no employment, worker, or contractor relationship between us.
          <br />
          <br />
          We can't give tax advice, so please check the tax implications with a qualified advisor in your country.
        </>
      ),
      answerText: 'The grant is a fellowship grant in support of your AI safety or biosecurity transition. It is not a salary or a contract for services. BlueDot is a UK entity, so we don\'t issue W-2s or 1099s, and the agreement explicitly states there is no employment, worker, or contractor relationship between us. We can\'t give tax advice, so please check the tax implications with a qualified advisor in your country.',
    },
  ],
};
