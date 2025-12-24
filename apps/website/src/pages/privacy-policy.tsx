import {
  HeroSection,
  HeroH1,
  HeroH2,
  Section,
  Breadcrumbs,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';

const CURRENT_ROUTE = ROUTES.privacyPolicy;

const PrivacyPolicyPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <HeroSection>
        <HeroH1>Privacy Policy</HeroH1>
        <HeroH2>Effective date: 30 August, 2024</HeroH2>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
BlueDot Impact Ltd is a UK non-profit, registered as a company limited by guarantee (company number [14964572](https://find-and-update.company-information.service.gov.uk/company/14964572)). You can contact us at [team@bluedot.org](mailto:team@bluedot.org).

We are a data controller. This means we make decisions about how your information is used, and have a responsibility to protect your rights when we do so.

This policy describes how we collect, use, and share your personal information when you:
- visit our websites or applications, including bluedot.org, aisafetyfundamentals.com, biosecurityfundamentals.com (collectively "Platforms"); or
- interact with us directly (e.g. by email or Slack, or at an event)

## What personal information do we collect?

### Personal information we collect from you directly

- Activity on our Platforms, such as applications to our courses, attendance at discussions, or exercise responses on our Course Hub.
- Communications between us, such as emails or Slack messages to our staff.

### Personal information we collect from your devices

- Usage data, associated with technical identifiers such as a cookie on your web browser.
- Information about what marketing channel you came from, if relevant.

We typically collect this information through the use of cookies and similar technologies. For more information on how we use cookies, see the section 'What cookies do we use?' below.

### Personal information we collect from third parties

We may receive information about you from third parties, including:

- Your contact details. For example, an organisation might want us to run a version of our courses just for them, and in doing this share a list of staff to invite to that event.
- Recommendations relating to you. For example, we might ask around to find someone who would be good to review our content for accuracy. In the course of this, someone else might suggest your name as someone to reach out to.
- References relating to you. For example, if you apply for one of our jobs we might contact your references. We'll usually tell you before reaching out to any references.

### Personal information we collect from public sources

We may collect your information from public sources, including sites like LinkedIn or GitHub. This information may include your education, employment history, and credentials. We may do this, for example, when you apply to our courses or jobs.

## How do we use your personal information?

### Legal bases for processing your personal information

We'll process your personal information only where we have a legal basis for doing so, including:

- our contractual obligations with you, or to begin entering a contract with you;
- our legitimate interests (or those of a third party) and your interests and rights don't override our interests;
- your consent; or
- to comply with the law.

When we refer to our legitimate interests, we mean:

- to assess your suitability for our courses, jobs, or other opportunities;
- to operate your account with us, and maintain platforms we run such as our Course Hub or the community Slack;
- to improve our Platforms, services, marketing efforts, and user experience;
- to communicate with you, including collecting feedback and connecting you with opportunities;
- to assess the impact of our work, and to promote our work through, for example, case studies and blog posts;
- to advance the fields we operate in;
- to generally protect our legal rights.

### Special category data

Some information is "special category data" under the UK GDPR. We sometimes collect special category data, for example we ask for your ethnic origin in our course application form for diversity monitoring.

We'll usually collect this from you directly, and ask for your consent before processing this data. In rare situations we may rely on other legal bases to process it, for example, to protect your vital interests or to obtain legal advice.

### Automated individual decision-making

We aim to make fair and informed decisions on all applications to our courses. As a small team, we use AI systems to help us review the large volume of applications we receive.

We begin by considering the intended outcomes of each course. We work backwards to the types of skills, experience and attributes that indicate an applicant is likely to succeed. We translate these into objective numerical rubrics, and then we manually evaluate subsets of randomly selected applications to calibrate and validate these rubrics. Once finalised, we use AI systems such as large language models to score incoming applications. We ensure these scores match the ones given by humans on the sample set, and continue monitoring system performance by doing random checks of application scores.

After initial scoring, humans review each applicant manually to make the actual application decision, taking into account the scores and other data we have on a candidate. We are careful to ensure outlier applications are appropriately handled, and have systems in place to flag people who might score low on the rubrics but could be a good fit for the course anyway.

Under data protection legislation, you may have the right to have a human re-review the scoring part of the application process, express your point of view and to contest the decision. To exercise this right contact us via the details at the top of this privacy policy.

### Information sharing

We may share your information:

- with people on our courses, for example by adding you to a calendar invites for your group where you can see each other's names and emails.
- publicly, for example if you've consented to us publishing your course project submission or testimonial.
- with third-party service providers, who will process it on our behalf. We use third-party providers of certain services such as database hosting, website hosting, website analytics, email automation, and payment processing.
- with marketing platforms to create targeting lists or lookalike audiences, to improve our marketing efforts.
- with other organizations for the purposes set out in this Privacy Policy, including those with relevant opportunities if you consented to this when applying
- in exceptional circumstances, where there's a legal or "duty of care" imperative (for example if we need to safeguard other individuals)
- with government authorities, if required by law or to protect our legitimate interests (e.g. with HMRC for tax regulation purposes in the UK);
- if all or part of our organization is closed, combined with another organization, or becomes its own organization, we may share your personal information with our external advisors (such as lawyers, accountants, or financial advisors) and the owners of the new organization; and
- in connection with any legal process or potential legal process.

### Cross-border transfer of your personal information

If we share your information outside the UK, we'll take steps to maintain the same level of protection of your data. This includes entering into contracts such as an "international data transfer agreement", or those containing "standard contractual clauses".

### How long do we keep your personal information?

We'll keep your personal information while we need it for the purposes for which we collected it, to comply with our legal and regulatory obligations, to exercise our legal rights, and to protect ourselves from legal claims.

Afterwards, we'll delete or anonymize it so that nobody can identify you from the information.

### How do we secure your personal information?

Organizational and technical measures protect your personal information. We've taken steps to secure our IT systems and have procedures to handle suspected data breaches. We'll notify you of any data breaches if required by law.

Our security measures include:

- providing staff relevant security training;
- encrypting information in transit and at rest;
- using single sign-on to access most internal services;
- enforcing TOTP or hardware security key 2-step verification to access internal services;
- using password managers to reduce the success of phishing attacks;
- storing encrypted backups of critical data;
- enabling built-in antivirus software and keeping devices up to date;
- only using reputable third-party providers; and
- using PCI-compliant processors to handle payment details

## What cookies do we use?

**Essential cookies**

These cookies are required to enable core functionality. This includes technologies that allow you to use our Platforms; prevent fraudulent activity and improve security; or that allow you to make use of other website functions.

The cookies that we use in this category are:

- cookielawinfo-checkbox-*: Set by the GDPR Cookie Consent plugin, this cookie is used to record the user consent for the cookies in various categories.
- _GRECAPTCHA: Set by the provider ReCaptcha. This is used on forms to protect our Platforms against bots.
- __stripe_mid, __stripe_sid, ndcd: Set by Stripe. This is used to prevent fraud when taking payments.
- agisf_* (when logged in): Set by our course hub. This keeps you signed in to your account as you navigate between pages.

### Non-essential cookies

These cookies help us improve or optimize the experience we provide. They allow us to measure how visitors interact with the Platforms and we use this information to improve the user experience and performance of the Platforms.

The cookies that we use in this category are:

- _ga*, _gid, _gat: Set by Google Analytics. This helps us understand how people are interacting with our websites, for example what order you view pages in, and whether you're a new or returning visitor.
- ph_*: Set by PostHog Analytics. This helps us understand how people are interacting with our websites, for example what order you view pages in, and whether you're a new or returning visitor.
- agisf_* (when not logged in): Set by our course hub. This helps us understand how people are interacting with our course hub.
- Google gclid: Set by Google Ads. This helps us understand how effective our marketing efforts are, for example by tracking when users who clicked an advert go on to apply for a course.
- X (Twitter) pixel: Set by X Ads. This helps us understand how effective our marketing efforts are, for example by tracking when users who clicked an advert go on to apply for a course.
- Meta (Facebook) pixel, _fbp: Set by Meta Ads. This helps us understand how effective our marketing efforts are, for example by tracking when users who clicked an advert go on to apply for a course.
- LinkedIn Insight tag: Set by LinkedIn Ads. This helps us understand how effective our marketing efforts are, for example by tracking when users who clicked an advert go on to apply for a course.

## Your personal information rights

You can contact us via the details above to:

- get a copy of your personal information (sometimes in a structured, machine readable format);
- ask us to correct, delete, or restrict use of your personal information;
- object to the use of your personal information; and
- withdraw consent you've given us to process your data

These rights are sometimes limited. For example, we can't comply if answering your request would reveal personal information about another person, or if you ask us to delete information which we're required by law to keep.

If you're based in the UK or EU you can also complain to a data protection authority, such as the UK's [Information Commissioner's Office](https://ico.org.uk/).

## Updates to this Privacy Policy

We reserve the right to change this Privacy Policy. We'll alert you when we do this by updating the date of this Privacy Policy, or as otherwise may be required by law.
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default PrivacyPolicyPage;
