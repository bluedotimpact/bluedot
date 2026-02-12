import {
  HeroSection,
  HeroH1,
  Section,
  Breadcrumbs,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'AI Safety Resources',
  url: '/resources',
  parentPages: [ROUTES.home],
};

const ContentPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <HeroSection>
        <HeroH1>{CURRENT_ROUTE.title}</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
This is a compilation of many of the resources likely to be useful to people in the AI safety space that we are aware of.

<Collapsible title="Introductions to AI safety">

**For a popular audience**

We think these are great resources to share with others who might be interested in learning about what AI safety is in a low-cost way. We think these are great to look at before applying to our programme, to get a feel for what the content is going to be about.

- [Intro to AI Safety](https://www.youtube.com/watch?v=pYXy-A4siMw) (18 minute video by Robert Miles, a YouTuber who makes content about AI safety)
- [The case for taking AI seriously as a threat to humanity](https://www.vox.com/future-perfect/2018/12/21/18126576/ai-artificial-intelligence-machine-learning-safety-alignment) – Kelsey Piper (an author for Vox's [Future Perfect](https://www.vox.com/future-perfect) column reporting on 'Finding the best ways to do good')
- [Benefits & Risks of Artificial Intelligence](http://futureoflife.org/background/benefits-risks-of-artificial-intelligence/) – Future of Life Institute (an institute dedicated to ensuring tomorrow's technologies are beneficial for humanity)
- [Without specific countermeasures, the easiest path to transformative AI likely leads to AI takeover](https://www.alignmentforum.org/posts/pRkFkzwKZ2zfa3R6H/without-specific-countermeasures-the-easiest-path-to) – Ajeya Cotra. We think this post explains the alignment problem in the context of deep learning, which makes a relevant introduction for modern machine learning enthusiasts.
- [An Introduction to the AI Alignment Landscape](https://www.alignmentforum.org/posts/SQ9cZtfrzDJmw9A2m/my-overview-of-the-ai-alignment-landscape-a-bird-s-eye-view) – Neel Nanda.
- [Human Compatible](https://www.amazon.co.uk/Human-Compatible-AI-Problem-Control/dp/0141987502) by Stuart Russell (UC Berkeley) is our default recommendation for people who haven't already read books about AI safety. We think this book provides the best and most focused introduction to the alignment problem, though it doesn't cover a wide breadth of solutions.
- [The Coming Wave](https://www.amazon.com/Coming-Wave-Technology-Twenty-first-Centurys/dp/0593593952) by Mustafa Suleyman is a more recently published book. It mostly discusses misuse risks from AI (like bioweapons, cyberattacks, political unrest), with a small amount on misalignment risk.
- [Chip War](https://www.amazon.com/Chip-War-Worlds-Critical-Technology/dp/1982172002) introduces the history of the semiconductor supply chain, and geopolitical tensions around AI chips. It mostly focuses on Taiwan and relations between US and China (the two most important powers in the semiconductor industry).

**More academic introductions**

These resources are useful for people who want a more comprehensive introduction to AI safety than the previous section. These resources take a variety of different approaches. Some are specifically targeted at machine learning practitioners, which we feel is useful for connecting elements of AI safety with the forefronts of machine learning research.

- [Bibliography](https://humancompatible.ai/bibliography) of research areas that need further attention according to the [Centre for Human Compatible AI](https://humancompatible.ai/), UC Berkeley. On that site, you can set a priority threshold for which materials to show.
- [Unsolved problems in ML Safety](https://arxiv.org/abs/2109.13916) – Dan Hendrycks. This paper frames many problems in AI safety in the context of modern machine learning systems. We think it's a good introduction for machine learning academics hoping to learn more about machine learning problems they could help work on.
- [ML safety scholars' course](https://course.mlsafety.org/) – Dan Hendrycks. This course takes a Machine Learning-first approach to AI safety, which forms the basis of a closely-related field Hendrycks terms 'ML safety'. It may be a good way to learn safety-relevant ML techniques and concepts, at the same time as ML safety concepts.
- [Alignment forum curated sequences](https://www.alignmentforum.org/library)

</Collapsible>

<Collapsible title="Introductions to ML engineering">

**Learning to code:**

If you're interested in working on technical AI safety via machine learning, it's overwhelmingly likely that you'll use Python. These are our recommended resources for picking up the Python programming language.

- [LearnPython.org](https://www.learnpython.org/)
- [Kaggle course](https://www.kaggle.com/learn/python)
- [Reddit Learn Programming FAQ](https://www.reddit.com/r/learnprogramming/wiki/faq/?v=a4c39d3c-54c6-11e2-8314-12313d08fd18)

**Basic ML introductions:**

If you're interested in working on technical AI safety, the current AI paradigm dictates that Machine Learning knowledge is essential. The below resources are not safety-relevant, but could be a good place to start to learn more about machine learning.

- [What is a neural network](https://www.youtube.com/watch?v=aircAruvnKk&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi) – 3Blue1Brown Deep Learning Series for a very high-level understanding of what ML is.
- [fast.ai](https://www.fast.ai/) courses (most recommended). Focuses on various state of the art techniques and applied deep learning. Emphasises a code-first approach, where models are applied and prompts you to think on a lower level later.
- [Deep learning with Pytorch crash course](https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html)
- [Deep learning for computer vision (Justin Johnson)](https://web.eecs.umich.edu/~justincj/teaching/eecs498/WI2022/schedule.html)
- [Google's machine learning crash course](https://developers.google.com/machine-learning/crash-course/ml-intro)

**More advanced:**

- [Jacob Hilton's deep learning curriculum](https://github.com/jacobhilton/deep_learning_curriculum) (Open AI researcher) – aimed mostly at skilling up in what's needed for working with Large Language Models.
- [Spinning up in deep RL](https://spinningup.openai.com/en/latest/index.html) (Open AI) – somewhere between a technical blog post and a text book. Nails the important relevant equations for reinforcement learning.
- [NYU's Deep Learning course](https://atcold.github.io/pytorch-Deep-Learning/)

**ML textbooks:**

- [Neural networks and deep learning (Nielsen)](http://neuralnetworksanddeeplearning.com/)
- [Deep Learning (Goodfellow, Bengio and Courville)](https://www.deeplearningbook.org/)
- [Reinforcement learning: an introduction (Sutton and Barto, 2nd edition)](http://incompleteideas.net/book/the-book-2nd.html)
- [Mathematics for machine learning (Deisenroth, Faisal and Ongg)](https://mml-book.github.io/)
- [Contemporary machine learning for physicists (Kaplan)](https://sites.krieger.jhu.edu/jared-kaplan/files/2019/04/ContemporaryMLforPhysicists.pdf)

</Collapsible>

<Collapsible title="Podcasts and newsletters">

**Both technical and policy**

- [80,000 Hours' AI podcasts](https://80000hours.org/topic/causes/catastrophic-risks/artificial-intelligence/?content-type=podcast) – Discussions with prominent researchers on risks from frontier AI. Most episodes are very accessible to people new to the field.
- [AXRP: the AI X-risk Research Podcast](https://axrp.net/) – Daniel Filan (UC Berkeley) interviews leading researchers in the field of AI safety. Most episodes are quite technical, but there are a few AI governance researcher interviews.
- [The Inside View podcast](https://theinsideview.ai/) – This podcast strikes a middle ground between 80k and AXRP in terms of how technical the content is. It has several interviews with policy-oriented guests.
- [ML Safety Newsletter](https://newsletter.mlsafety.org/p/ml-safety-newsletter-1) – by Dan Hendrycks. The latest news and research from the ML community, related to making ML safer.

**Technical safety focus**

- [The Alignment Newsletter](https://rohinshah.com/alignment-newsletter/) – by Rohin Shah
- [AI Safety in China](https://aisafetychina.substack.com/) – stay up to date with AI safety news from China.

**Strategy & policy focus**

- [Import AI](https://jack-clark.net/) – Jack Clark rounds up the latest progress towards advanced AI. This newsletter mostly takes a policy angle, though includes technical advances.
- [EU AI Act Newsletter](https://artificialintelligenceact.substack.com/) – Researchers at the Future of Life Institute summarise the latest key developments in the EU AI act, with a lens of general, frontier AI systems.
- [policy.ai](https://cset.georgetown.edu/newsletters/). A biweekly newsletter on AI policy by the Centre for Security and Emerging Technology (CSET).
- [Digital Bridge](https://www.politico.eu/newsletter/digital-bridge/) – by Politico. A "weekly transatlantic tech newsletter uncovers the digital relationship between critical power-centers through exclusive insights and breaking news for global technology elites and political influencers."
- [Jeffrey Ding's ChinAI](https://chinai.substack.com/) – by Jeffrey Ding. "ChinAI bets on the proposition that the people with the most knowledge and insight [on AI development in China] are Chinese people themselves who are sharing their insights in Chinese."

</Collapsible>

<Collapsible title="Funding for AI safety work">

- [Long-Term Future Fund](https://funds.effectivealtruism.org/funds/far-future) (LTFF) – EA Funds
  - Applying to the EA Funds is an [easy and flexible process](https://forum.effectivealtruism.org/posts/caayRw2pgNLtqt9Pz/ea-funds-is-more-flexible-than-you-might-think), so we recommend you err on the side of applying if you're not sure.
  - They have historically funded: up-skilling in a field to prepare for future work; movement-building programs; scholarships, academic teaching buy-outs, and additional funding for academics to free up their time; funding to make existing researchers more effective; direct work in AI; seed money for new organizations; and more
  - If you're not sure where to apply, we recommend you default to this.
- [Career development and transition funding](https://www.coefficientgiving.org/career-development-and-transition-funding/) – Coefficient Giving
  - This program aims to provide support – primarily in the form of funding for graduate study, but also for other types of one-off career capital-building activities – for early-career individuals who want to pursue careers that help improve the long-term future
  - As with the EA Funds, applying is an easy and flexible process.
- [Coefficient Giving Undergraduate Scholarship](https://www.coefficientgiving.org/undergraduate-scholarship/)
  - This program aims to provide support for highly promising and altruistically-minded students who are hoping to start an undergraduate degree at one of the top universities in the USA or UK, and who do not qualify as domestic students at these institutions for the purposes of admission and financial aid.
- [Future of Life Institute – Grants](https://grants.futureoflife.org/)
  - Many different grant opportunities: project proposals; PhD fellowships; post-doctoral fellowships; and for professors to join their AI Existential Safety community
- Your university or government might fund you to do research with them, especially for research internships or PhDs.
  - In the UK, most PhD sponsorship is via [UKRI Studentships](https://www.ukri.org/apply-for-funding/studentships-and-doctoral-training/get-a-studentship-to-fund-your-doctorate/)
- The [80,000 Hours jobs board lists other open funding opportunities in AI safety](https://jobs.80000hours.org/?refinementList%5Btags_area%5D%5B0%5D=AI+safety+%26+policy&refinementList%5Btags_role_type%5D%5B0%5D=Funding).

</Collapsible>

<Collapsible title="Other resource lists">

- [AISafety.com](https://www.aisafety.com/) – Including [events and training](http://aisafety.com/events-and-training), and [AI safety communities](https://www.aisafety.com/communities)
- [The AI Alignment and Governance Landscape](https://aisafety.world/tiles/) – AI Safety World
- [Lots of Links](https://www.aisafetysupport.org/lots-of-links) – AI Safety Support
- [AI Safety Resources](https://vkrakovna.wordpress.com/ai-safety-resources/) – Victoria Krakovna

</Collapsible>`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
