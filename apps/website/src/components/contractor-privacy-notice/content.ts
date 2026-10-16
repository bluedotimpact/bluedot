import type { IconType } from 'react-icons';
import {
  FaEnvelope,
  FaInbox,
  FaLayerGroup,
  FaShareNodes,
  FaShieldHalved,
  FaSliders,
} from 'react-icons/fa6';

/*
 * All copy for the Contractor Privacy Notice (/privacy). The legal wording is approved:
 * don't change it without sign-off from Operations.
 *
 * Text supports two inline markdown features: **bold** and [link text](url).
 */

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'subheading'; text: string }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'callout'; title: string; text: string }
  | { type: 'legalBasis'; bases: string[] };

export type NoticeSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
  readMore?: { title: string; blocks: ContentBlock[] };
};

export type GlanceCard = {
  title: string;
  icon: IconType;
  items?: string[];
  text?: string;
  link?: { text: string; href: string };
};

export const META_DESCRIPTION = 'How BlueDot Impact collects, uses, and shares personal information about the contractors we work with.';

export const EFFECTIVE_DATE = 'Effective date: 14 October, 2026.';

export const INTRO: ContentBlock[] = [
  { type: 'paragraph', text: 'BlueDot Impact Ltd ("BlueDot UK") is a UK non-profit, registered as a company limited by guarantee (company number [14964572](https://find-and-update.company-information.service.gov.uk/company/14964572)). Its US affiliate, BlueDot Impact US Inc ("BlueDot US"), is a New Jersey nonprofit corporation recognised as a 501(c)(3) public charity (EIN [99-4885308](https://projects.propublica.org/nonprofits/organizations/994885308)). You can contact us at [team@bluedot.org](mailto:team@bluedot.org).' },
  { type: 'paragraph', text: 'We are data controllers. This means we make decisions about how your information is used, and have a responsibility to protect your rights when we do so.' },
  { type: 'paragraph', text: 'This notice describes how we collect, use, and share your personal information when you:' },
  {
    type: 'list',
    items: [
      'work with us as an independent contractor, for example as a course facilitator, reading group organiser, teaching fellow, adviser or consultant, whether as an individual or through your own company; or',
      'interact with us in connection with that work (e.g. by email or Slack, or at an event)',
    ],
  },
];

export const AT_A_GLANCE = {
  id: 'at-a-glance',
  title: 'Your privacy at a glance',
  cards: [
    {
      title: 'What we collect',
      icon: FaLayerGroup,
      items: [
        'Contact and identity details',
        'Your agreement and the work you do with us',
        'Payment and tax details',
        'Eligibility checks, like where you can work',
        'Feedback and records of your sessions',
        'Information from our tools and meetings',
      ],
      link: { text: 'More on what we collect', href: '#what-we-collect' },
    },
    {
      title: 'How we use it',
      icon: FaSliders,
      items: [
        'To set up, manage and end your engagement',
        'To pay you and meet our tax and legal duties',
        'To run high-quality courses and events',
        'To keep our systems and community safe',
      ],
      link: { text: 'More on how we use it', href: '#how-we-use-it' },
    },
    {
      title: 'Who helps us',
      icon: FaShareNodes,
      items: [
        'Workspace: Google Workspace, Slack, Notion, Airtable, Zoom',
        'Contracts and payments: Dropbox Sign, Ramp, Wise, PayPal',
        'AI tools: Claude, Codex',
        'Advisers: our finance partner, accountants and lawyers',
      ],
      link: { text: 'More on who we share it with', href: '#who-we-share-it-with' },
    },
    {
      title: 'When we collect it',
      icon: FaInbox,
      items: [
        'You sign your agreement',
        'You submit an invoice',
        'You run sessions or groups',
        'You use our tools',
        'Others give feedback on your work',
      ],
      link: { text: 'More on when we collect it', href: '#when-we-collect-it' },
    },
    {
      title: 'Your rights',
      icon: FaShieldHalved,
      items: [
        'See the data we hold about you',
        'Correct it',
        'Ask us to delete it',
        'Object to how we use it',
        'Take a copy with you',
        'Complain about us',
      ],
      link: { text: 'More on your rights', href: '#your-rights' },
    },
    {
      title: 'Questions?',
      icon: FaEnvelope,
      text: 'You can contact us at [team@bluedot.org](mailto:team@bluedot.org).',
    },
  ] satisfies GlanceCard[],
};

export const ON_THIS_PAGE = {
  id: 'on-this-page',
  title: 'On this page',
  links: [
    { text: 'Our role in your privacy', href: '#our-role' },
    { text: 'When and how we collect data', href: '#when-we-collect-it' },
    { text: 'What types of data we collect', href: '#what-we-collect' },
    { text: 'How and why we use your data', href: '#how-we-use-it' },
    { text: 'AI tools and automated decisions', href: '#ai-tools' },
    { text: 'Your privacy choices and rights', href: '#your-rights' },
    { text: 'How secure is your data?', href: '#security' },
    { text: 'Where do we store your data?', href: '#where-we-store-it' },
    { text: 'How long do we keep your data?', href: '#how-long-we-keep-it' },
    { text: 'Third parties who process your data', href: '#who-we-share-it-with' },
    { text: 'Making this notice great', href: '#changes' },
  ],
};

export const SECTIONS: NoticeSection[] = [
  {
    id: 'our-role',
    title: '1. Our role in your privacy',
    blocks: [
      { type: 'paragraph', text: 'This notice applies whether you work with us once or on an ongoing basis, whether BlueDot UK or BlueDot US engages you, and whether you contract as an individual or through your own company. It keeps applying after your engagement ends.' },
      { type: 'paragraph', text: 'It doesn\'t cover BlueDot employees or grant recipients. If you\'re a course participant or you use our websites, our [Privacy Policy](/privacy-policy) applies instead.' },
    ],
    readMore: {
      title: 'Read more: who\'s responsible for your data',
      blocks: [
        { type: 'paragraph', text: 'The entity named as the "Client" in your agreement is the **controller** of your personal data, which means it decides how and why your data is used. Course facilitators and reading group organisers on our standard terms are engaged by BlueDot UK.' },
        { type: 'paragraph', text: 'Because both entities share the same systems and team, the other entity may also access and use your data for the purposes in this notice. For example, BlueDot UK might engage you while you work with colleagues at BlueDot US. The same standards apply either way, and you can exercise your rights with either entity by contacting us at [team@bluedot.org](mailto:team@bluedot.org).' },
        { type: 'paragraph', text: 'You can also write to us at:' },
        {
          type: 'list',
          items: [
            '**BlueDot Impact Ltd**, 71–75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom',
            '**BlueDot Impact US Inc**, 111 E Linden Ave, Collingswood, NJ 08108, United States',
          ],
        },
        { type: 'subheading', text: 'Your responsibilities' },
        {
          type: 'list',
          items: [
            'Check your agreement too. It sets out your own data protection duties when you handle personal data for us, such as participants\' details.',
            'Keep your details up to date, especially your bank and tax details.',
            'If you give us information about someone else, such as an emergency contact, a substitute or a referee, let them know and point them to this notice.',
          ],
        },
        { type: 'callout', title: 'Contracting through your own company?', text: 'If you work with us through a limited company, LLC or other business, our contract is with that business. This notice covers the people who actually do the work, which is usually you.' },
        { type: 'callout', title: 'Applying to work with us?', text: 'What you tell us when you apply, for example through our facilitator application form, is covered by our [Privacy Policy](/privacy-policy). Once we engage you, this notice applies too.' },
      ],
    },
  },
  {
    id: 'when-we-collect-it',
    title: '2. When and how we collect data',
    blocks: [
      { type: 'paragraph', text: 'Most of the data we hold about you comes from you. Some is generated as you work with us, and some comes from other people, like the colleagues and participants you work with.' },
      {
        type: 'table',
        columns: ['When', 'You give us data', 'We collect data'],
        rows: [
          ['You accept our terms or sign your agreement', '✓', '✓'],
          ['You set up payment or submit an invoice', '✓', ''],
          ['We give you access to our tools, like email, Slack or Airtable', '', '✓'],
          ['You run sessions, groups or events for us', '✓', '✓'],
          ['You email, message or meet with us', '✓', '✓'],
          ['Participants or colleagues give feedback on your work', '', '✓'],
          ['We or our payment providers check sanctions lists before you\'re paid', '', '✓'],
        ],
      },
    ],
    readMore: {
      title: 'Read more: where else we get data from',
      blocks: [
        {
          type: 'list',
          items: [
            '**The BlueDot team member who brings you on board.** When they request your agreement, they share details like your name, contact details, location, role, rate and dates. Where relevant, they also share your nationality and visa status.',
            '**Course participants and community members**, for example through feedback forms or messages in our community spaces.',
            '**Payment providers and banks.** For example, Ramp verifies the bank and tax details you give it, and Wise and PayPal confirm payments.',
            '**Public sources** such as your LinkedIn profile, website or published work, where it\'s relevant to the role.',
            '**Government sanctions lists** in the UK and US.',
            '**Referees**, if you give us their details and we contact them.',
            '**Professional advisers**, such as immigration advisers, where relevant.',
          ],
        },
        { type: 'paragraph', text: 'When you use our websites, including our course platform, our [Privacy Policy](/privacy-policy) explains what we collect, including through cookies.' },
      ],
    },
  },
  {
    id: 'what-we-collect',
    title: '3. What types of data we collect',
    blocks: [
      {
        type: 'list',
        items: [
          '**Contact and identity details.** Your name, email address, phone number, postal address, country and time zone. If you contract through a company, we also hold its details.',
          '**Your engagement.** Your agreement and any renewals, your role and services, rates, reporting manager and dates. We also keep records of how you accepted our terms: the date and version you accepted, or the e-signature audit trail, which logs IP addresses and timestamps.',
          '**Payment and tax details.** Bank details, invoices and supporting evidence, payment history, tax and VAT status, and tax forms, such as a US Form W-9 (which includes your taxpayer identification number) or a W-8BEN.',
          '**Your work with us.** The courses, cohorts, groups or projects you work on, your availability, the sessions you deliver and who attends them, and reports you write (like post-call mentoring notes). It also includes feedback on your work from participants and our team, including from observing sessions.',
          '**Eligibility checks.** Where you\'re based and, where relevant, your nationality and immigration status. We also hold the information we need to confirm your employment and tax status, and the results of sanctions screening.',
          '**Information from our tools and meetings.** Your BlueDot accounts, the messages and files you create in our tools, calendar invites, meeting notes, transcripts and recordings, and security logs such as sign-in records.',
        ],
      },
    ],
    readMore: {
      title: 'Read more: in-person events, sensitive data and criminal records',
      blocks: [
        { type: 'subheading', text: 'If you join us in person' },
        { type: 'paragraph', text: 'Travel and accommodation bookings, expense receipts, dietary or accessibility needs, and an emergency contact.' },
        { type: 'subheading', text: 'What about really sensitive data?' },
        { type: 'paragraph', text: 'We don\'t generally collect "special category" data about contractors, such as information about health, ethnicity, religion or sexual orientation. The exception is information you choose to share so we can support you, like a disability, health condition or dietary need ahead of an event. We\'ll use it only for that purpose and only with your explicit consent, unless we need it to protect someone\'s life in an emergency or the law otherwise allows it (for example, for safeguarding or to deal with a legal claim). You can withdraw your consent at any time.' },
        { type: 'subheading', text: 'What about criminal records?' },
        { type: 'paragraph', text: 'We don\'t run criminal record checks on contractors as standard. If a particular role ever needs one, we\'ll tell you first. Otherwise, we\'d only use information about criminal offences where the law allows, for example to protect participants, prevent fraud or deal with legal claims.' },
      ],
    },
  },
  {
    id: 'how-we-use-it',
    title: '4. How and why we use your data',
    blocks: [
      { type: 'paragraph', text: 'Data protection law means we can only use your data for specific reasons, and only where we have a legal basis to do so. Here\'s why we use it.' },
      { type: 'subheading', text: 'Setting up and managing your engagement' },
      { type: 'paragraph', text: 'Preparing and signing your agreement, onboarding you, giving you access to our tools, assigning work (like cohorts or groups), keeping in touch, and renewing or ending your engagement.' },
      { type: 'legalBasis', bases: ['Contract', 'Legitimate interests'] },
      { type: 'subheading', text: 'Paying you' },
      { type: 'paragraph', text: 'Processing your invoices, making payments, keeping financial records and correcting any payment errors.' },
      { type: 'legalBasis', bases: ['Contract', 'Legal obligation', 'Legitimate interests'] },
      { type: 'subheading', text: 'Meeting our tax and legal duties' },
      { type: 'paragraph', text: 'Collecting tax forms, reporting payments to tax authorities such as the IRS, and sharing information with HMRC where required. Checking where you can work from, assessing employment and tax status, screening against sanctions lists, and keeping the records the law requires.' },
      { type: 'legalBasis', bases: ['Legal obligation', 'Legitimate interests'] },
      { type: 'subheading', text: 'Running high-quality courses and events' },
      { type: 'paragraph', text: 'Tracking the sessions you deliver and who attends, collecting feedback, observing sessions, training and supporting you, and improving our materials.' },
      { type: 'legalBasis', bases: ['Legitimate interests'] },
      { type: 'subheading', text: 'Working together day to day' },
      { type: 'paragraph', text: 'Sharing your name and contact details with the colleagues, participants and community members you work with, for example in calendar invites, Slack and event pages.' },
      { type: 'legalBasis', bases: ['Contract', 'Legitimate interests'] },
      { type: 'subheading', text: 'Sharing our work publicly' },
      { type: 'paragraph', text: 'Naming organisers on public event pages, and publishing recordings of some public sessions, like reading group talks, with the consent of the people presenting.' },
      { type: 'legalBasis', bases: ['Consent', 'Legitimate interests'] },
      { type: 'subheading', text: 'Supporting access needs and safety at events' },
      { type: 'paragraph', text: 'Using information you choose to share, like accessibility or dietary needs, to support you, and contacting your emergency contact if something happens.' },
      { type: 'legalBasis', bases: ['Consent', 'Vital interests'] },
      { type: 'subheading', text: 'Keeping our systems and community safe' },
      { type: 'paragraph', text: 'Managing accounts and access, preventing misuse and fraud, and investigating security incidents or safeguarding concerns.' },
      { type: 'legalBasis', bases: ['Legitimate interests', 'Legal obligation'] },
      { type: 'subheading', text: 'Future opportunities' },
      { type: 'paragraph', text: 'Inviting you back for future rounds (like our quick-apply route for returning facilitators), telling you about roles that might suit you, and giving references when you ask. You can opt out at any time.' },
      { type: 'legalBasis', bases: ['Legitimate interests'] },
      { type: 'subheading', text: 'Running BlueDot responsibly' },
      { type: 'paragraph', text: 'Audits, governance, getting legal and professional advice, and handling disputes or legal claims.' },
      { type: 'legalBasis', bases: ['Legitimate interests', 'Legal obligation'] },
    ],
    readMore: {
      title: 'Read more: what each legal basis means',
      blocks: [
        {
          type: 'list',
          items: [
            '**Contract.** We need your data to enter into or carry out our agreement with you, or to take steps you ask for before signing. If you contract through your own company, our contract is with the company, so we rely on legitimate interests instead.',
            '**Legal obligation.** We need your data to comply with the law, for example UK tax and accounting rules or UK sanctions law.',
            '**Legitimate interests.** We need your data for our legitimate interests, or those of someone else, and your interests and rights don\'t override them. Our legitimate interests are running BlueDot efficiently and keeping good records; delivering high-quality courses, events and community spaces; managing our relationships with the people who work with us; keeping our systems, team and community safe; complying with laws outside the UK that apply to us, such as US tax and sanctions rules; and establishing, exercising or defending legal claims. You can object to us using your data on this basis (see [section 6](#your-rights)).',
            '**Consent.** You\'ve given clear consent for a specific purpose, such as using health information to make adjustments for you. You can withdraw it at any time by emailing [team@bluedot.org](mailto:team@bluedot.org). We\'ll then stop, unless we have another legal basis to continue, in which case we\'ll tell you.',
            '**Vital interests.** Very rarely, we may need to use your data to protect someone\'s life, for example by telling paramedics about a serious allergy.',
          ],
        },
        { type: 'paragraph', text: 'If we ever want to use your data for a new purpose, we\'ll tell you first.' },
      ],
    },
  },
  {
    id: 'ai-tools',
    title: '5. AI tools and automated decisions',
    blocks: [
      { type: 'paragraph', text: 'Like many teams, we use AI tools in our everyday work. For example, we use AI assistants such as Claude and Codex to help draft documents, write code and analyse information, and AI note-takers to transcribe and summarise meetings. These tools may process information about you that appears in our documents, messages and meetings.' },
      { type: 'paragraph', text: 'We don\'t make decisions that significantly affect you, like whether to engage you, what to pay you or whether to end your engagement, based solely on automated processing. Some routine steps are automated, such as counting the sessions you\'ve delivered or sending you a link to submit your invoice. But a person reviews and approves every engagement, payment and termination.' },
    ],
  },
  {
    id: 'your-rights',
    title: '6. Your privacy choices and rights',
    blocks: [
      { type: 'subheading', text: 'Your choices' },
      {
        type: 'list',
        items: [
          '**You can choose not to give us certain data.** But we need some of it to work with you. Some is required by law, like tax forms, and some we need under your agreement, like your bank details. Without bank details we can\'t pay you. Without the tax forms or eligibility information we need, we may not be able to engage you. If BlueDot US pays you and you don\'t give us a valid taxpayer identification number, US tax rules may require us to withhold part of your payment ("backup withholding").',
          '**You can opt out of hearing about future opportunities.** Just tell us and we\'ll stop.',
        ],
      },
      { type: 'subheading', text: 'Your rights' },
      { type: 'paragraph', text: 'Wherever you\'re based and whichever BlueDot entity engages you, you can ask us to:' },
      {
        type: 'list',
        items: [
          '**See the data we hold about you.** This is called a subject access request. We\'ll give you a copy and explain how we use it: why, what types of data, who we share it with, how long we keep it, and where we got it from.',
          '**Correct your data** if it\'s inaccurate or incomplete.',
          '**Delete your data** where we no longer need it or have no legal reason to keep it.',
          '**Restrict how we use your data**, for example while we check whether it\'s accurate.',
          '**Object to how we use your data** where we rely on legitimate interests. We\'ll stop unless we have compelling reasons to continue.',
          '**Take your data with you.** We\'ll give you the data you gave us in a common machine-readable format, like CSV or JSON. If it\'s technically possible, we can also send it straight to another organisation.',
          '**Withdraw your consent** at any time, where we rely on it.',
        ],
      },
      { type: 'paragraph', text: 'To do any of these, email [team@bluedot.org](mailto:team@bluedot.org) or write to us at one of the addresses in [section 1](#our-role).' },
      { type: 'subheading', text: 'Complaints' },
      { type: 'paragraph', text: 'If you\'re unhappy with how we\'ve handled your data, please tell us first so we can put things right. Email [team@bluedot.org](mailto:team@bluedot.org) or write to us at one of the addresses in section 1. Any complaint counts, however you send it. We\'ll acknowledge it within 30 days, look into it without undue delay, keep you updated, and tell you the outcome.' },
      { type: 'paragraph', text: 'You can also complain to the UK regulator, the Information Commission (still known as the ICO), at [ico.org.uk/make-a-complaint](https://ico.org.uk/make-a-complaint/). They\'ll usually expect you to have raised it with us first. If you\'re in the EU or EEA, you can also contact your local data protection authority.' },
    ],
    readMore: {
      title: 'Read more: how we handle requests',
      blocks: [
        { type: 'paragraph', text: 'It\'s free. We\'ll respond within one month. For complex requests we can take up to two more months, and we\'ll let you know if we need to. We may ask you to confirm your identity or clarify your request, and the time limit starts once we have what we need.' },
        { type: 'paragraph', text: 'Some rights have limits. For example, we must keep tax records for a set period, and we won\'t disclose information about other people.' },
        { type: 'callout', title: 'Engaged by BlueDot US and based outside the UK and EU?', text: 'UK and EU data protection law may not apply to your data. We\'ll still honour these requests wherever we reasonably can.' },
      ],
    },
  },
  {
    id: 'security',
    title: '7. How secure is your data?',
    blocks: [
      { type: 'paragraph', text: 'We use technical and organisational measures to protect your data, including:' },
      {
        type: 'list',
        items: [
          'single sign-on and two-step verification (authenticator apps or hardware security keys) for our internal tools',
          'encryption of data in transit and at rest',
          'password managers and security training for our team',
          'limiting access to payment, tax and identity information to the people who need it',
          'encrypted backups of critical data, and keeping devices up to date',
          'reputable providers, bound by contracts to protect your data',
        ],
      },
      { type: 'paragraph', text: 'We have a process for handling suspected data breaches. We\'ll tell you about a breach if it\'s likely to put you at high risk, or if the law otherwise requires us to.' },
    ],
    readMore: {
      title: 'Read more: Social Security numbers and staying safe',
      blocks: [
        { type: 'subheading', text: 'Social Security numbers and other tax IDs' },
        { type: 'paragraph', text: 'You may give us a US Social Security number or another taxpayer identification number, for example on a Form W-9. If so, we use it only to meet our tax obligations. We keep it confidential, limit access to the people who need it, never disclose it unlawfully or display it publicly, and dispose of it securely once we no longer need it.' },
        { type: 'subheading', text: 'Please remember' },
        {
          type: 'list',
          items: [
            'No system is completely secure.',
            'Keep your BlueDot account details safe and use two-step verification.',
            'If you think your data, or data you handle for us, has been compromised, tell us straight away at [team@bluedot.org](mailto:team@bluedot.org).',
          ],
        },
      ],
    },
  },
  {
    id: 'where-we-store-it',
    title: '8. Where do we store your data?',
    blocks: [
      { type: 'paragraph', text: 'We\'re based in the UK and the US, and many of our tools are run by US providers. So your data will usually be stored and processed in the UK, the US and the EU, and wherever our team members and providers are based. If you live somewhere else, we\'ll also send some data to your country, for example to pay you.' },
      { type: 'paragraph', text: 'When we transfer data out of the UK or EU, we make sure it stays protected.' },
    ],
    readMore: {
      title: 'Read more: how we protect international transfers',
      blocks: [
        { type: 'paragraph', text: 'Each transfer relies on one of the following:' },
        {
          type: 'list',
          items: [
            'the destination being approved by the UK government, such as the UK–US Data Bridge for certified US organisations',
            'approved contract terms, such as the ICO\'s International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses. These also cover data shared between BlueDot UK and BlueDot US',
            'where neither is available, the transfer being necessary for our agreement with you or your company, for example to pay you in your country',
          ],
        },
        { type: 'paragraph', text: 'To find out more, or to get a copy of the safeguards we use, email [team@bluedot.org](mailto:team@bluedot.org).' },
      ],
    },
  },
  {
    id: 'how-long-we-keep-it',
    title: '9. How long do we keep your data?',
    blocks: [
      { type: 'paragraph', text: 'We keep your data only as long as we need it. As a general rule, we keep records about your engagement for six years after it ends. For facilitators and organisers, that means six years after the last group or session you deliver for us. This lets us meet tax and accounting rules and deal with any questions or claims.' },
    ],
    readMore: {
      title: 'Read more: retention periods',
      blocks: [
        {
          type: 'table',
          columns: ['Data', 'How long we keep it'],
          rows: [
            ['Your agreement and engagement records', 'Six years after your engagement ends'],
            ['Invoices, payments and tax records, including tax forms', 'Six years after the end of the financial year they relate to, or longer if the law requires it. For example, US sanctions rules require some payment records to be kept for 10 years.'],
            ['Records of your sessions, attendance and feedback', 'Six years after your engagement ends'],
            ['Messages and files you create in our tools', 'Kept as part of our organisational records while they\'re useful for our work, then deleted in line with our retention settings'],
            ['Meeting notes, transcripts and recordings', 'Kept with the records of the work they relate to, and deleted once they\'re no longer needed for it'],
            ['Published recordings', 'Stay public while they\'re useful to our community. You can ask us to take one down at any time.'],
            ['Your BlueDot email or workspace accounts', 'Closed when your engagement ends'],
            ['Security logs', 'Kept for the periods set by the providers of our tools'],
            ['Sensitive information, such as health or dietary needs', 'Deleted once we no longer need it for the purpose you gave it'],
          ],
        },
        { type: 'paragraph', text: 'After that, we delete your data or anonymise it so it can no longer identify you. We may keep data longer if we need it for an ongoing dispute or legal claim.' },
      ],
    },
  },
  {
    id: 'who-we-share-it-with',
    title: '10. Third parties who process your data',
    blocks: [
      { type: 'paragraph', text: 'Like most organisations, we use service providers to help us run things, for example to host our documents, send messages, sign agreements and make payments. We share only what each one needs, and they can only use it to provide their service to us. Payment providers and banks also use your details for their own legal checks, such as fraud and anti-money-laundering checks, under their own privacy notices.' },
      { type: 'paragraph', text: 'We also share data with:' },
      {
        type: 'list',
        items: [
          'the other BlueDot entity (see [section 1](#our-role))',
          'the course participants and community members you work with, such as your name and contact details in calendar invites',
          'professional advisers, such as our accountants, lawyers and auditors',
          'tax authorities (such as HMRC and the IRS), regulators, courts or law enforcement, where the law requires it',
          'the organisations involved, and their advisers, if BlueDot is ever restructured or merged',
        ],
      },
      { type: 'paragraph', text: '**We never sell your data or share it with anyone for their own marketing.**' },
    ],
    readMore: {
      title: 'Read more: our main service providers',
      blocks: [
        {
          type: 'table',
          columns: ['Provider', 'What we use it for', 'Where'],
          rows: [
            ['**Google Workspace**', 'Email, calendars, documents and file storage', 'US and other locations'],
            ['**Slack**', 'Team and community messaging', 'US'],
            ['**Notion**', 'Internal wiki, team directory and meeting notes', 'US'],
            ['**Airtable**', 'Our main database, including contractor records, course operations, invoices and forms', 'US'],
            ['**Zoom**', 'Video calls and course sessions', 'US'],
            ['**MiniExtensions**', 'Forms, such as facilitator feedback forms', 'US'],
            ['**n8n**', 'Workflow automation, for example preparing agreement and invoice drafts', 'EU'],
            ['**Dropbox Sign**', 'E-signatures, including the signature audit trail', 'US'],
            ['**Ramp**', 'Paying invoices and verifying bank and tax details, mainly for US payees', 'US'],
            ['**Wise**', 'International payments', 'UK, EU and other locations'],
            ['**PayPal**', 'Payments', 'UK, US and other locations'],
            ['**Claude** (Anthropic)', 'AI assistant for drafting, research and analysis', 'US'],
            ['**Codex** (OpenAI)', 'AI assistant for coding and technical work', 'US'],
            ['**Luma**', 'Event pages for reading groups and other events', 'US'],
            ['**YouTube**', 'Publishing recordings of some public sessions', 'US'],
            ['**Impact Ops**', 'Outsourced finance and operations support, such as processing payments and bookkeeping', 'UK'],
          ],
        },
        { type: 'paragraph', text: 'We also work with accountants, lawyers, auditors and, where relevant, immigration advisers in the UK and US. They see only what\'s relevant to the advice or service they give us.' },
      ],
    },
  },
  {
    id: 'changes',
    title: '11. Making this notice great',
    blocks: [
      { type: 'paragraph', text: 'We\'ll update this notice when our practices or the law change. We\'ll post changes here, and we\'ll email current contractors about significant changes.' },
      { type: 'paragraph', text: 'If anything here is unclear, or you have ideas to make it better, email [team@bluedot.org](mailto:team@bluedot.org).' },
      // Juro's licence requires this credit line, word for word
      { type: 'paragraph', text: 'This privacy notice is based on an open-sourced design from [Juro](https://juro.com) and [Stefania Passera](https://stefaniapassera.com) - get your own [free privacy policy template](https://info.juro.com/privacy-policy-template).' },
    ],
  },
];
