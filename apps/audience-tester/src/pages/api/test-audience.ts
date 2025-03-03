import { z } from 'zod';
import axios from 'axios';
import env from '../../lib/api/env';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { asError } from '@bluedot/ui';

const requestSchema = z.object({
  text: z.string(),
});

const responseSchema = z.object({
  summary: z.string(),
  fullResponses: z.array(z.string()),
});

export type TestAudienceResponse = z.infer<typeof responseSchema>;

const personas = [
  "A 28-year-old marketing executive in London with moderate politics, used ChatGPT occasionally for brainstorming but remains skeptical about its accuracy. Constantly juggles networking events with Netflix binges, and finds the UK cost of living crisis is hampering her house deposit dreams.",
  "A 32-year-old HR coordinator in Chicago with center-right views who tried AI tools once during a mandatory training but dismissed them as 'glorified autocomplete.' Seven years at the same insurance company has left him cynical about corporate innovation while secretly applying for government jobs.",
  "A 25-year-old administrative assistant at a Berlin law firm with progressive politics who has never used AI tools and feels anxious whenever colleagues discuss them. Recently moved from rural Germany and spends weekends exploring the city while managing significant student debt.",
  "A 27-year-old junior accountant in Madrid who considers himself centrist and apolitical. Has read about AI but never used the tools, believing his profession requires human judgment. Works 60+ hours during tax season while moonlighting as a semi-professional salsa dancer.",
  "A 30-year-old pharmaceutical sales rep in NYC with moderately conservative views who uses ChatGPT weekly for email drafting. Recently promoted to team lead but struggling with imposter syndrome while maintaining a carefully curated Instagram presence showing her 'perfect' life.",
  "A 33-year-old customer service team lead in Manchester who avoids political discussions entirely. Heard about AI tools but considers them irrelevant to his work. Father to young twins and maintaining strict boundaries between work and home life, which his company consistently ignores.",
  "A 24-year-old non-binary project coordinator at a Paris creative agency with strong progressive values. Enthusiastically experiments with AI tools for both work and personal creative projects. Living in a tiny apartment with two roommates while trying to establish themselves in an expensive city.",
  "A 29-year-old legal assistant in Dublin with moderate views who uses ChatGPT occasionally to summarize legal documents, but keeps this hidden from partners at her firm. Studying part-time for law school while caring for an elderly parent, constantly feeling she's failing at both.",
  "A 34-year-old government clerk in Washington DC with traditional conservative values. Deeply skeptical of AI tools due to privacy and security concerns. Finds fulfillment in public service despite the bureaucracy, but increasingly concerned about political polarization affecting his workplace.",
  "A 26-year-old insurance claims processor in Amsterdam who identifies as social democratic. Uses Claude occasionally to simplify policy language for clients. First-generation university graduate navigating corporate culture while maintaining connections to her working-class community.",
  "A 31-year-old real estate agent in Miami with libertarian politics who recently discovered ChatGPT for writing property listings and is now slightly addicted to using it. Moved from the Midwest seeking opportunity but now questions whether homeownership is becoming impossible for his generation.",
  "A 27-year-old university administrator in Edinburgh with green-progressive politics. Daily AI tool user for everything from scheduling to communication drafts. Her efficiency innovations are respected but underpaid, leading to growing resentment as she completes her master's degree.",
  "A 35-year-old healthcare coordinator in Stockholm with centrist views who's curious about AI but has no hands-on experience. Overwhelmed by paperwork and sees technology as both potential savior and threat to the human elements of healthcare he values most.",
  "A 29-year-old non-profit program manager in Boston with progressive politics who uses AI tools moderately for grant writing and data analysis. Passionate about her organization's mission but experiencing burnout from the combination of low pay, high expectations, and compassion fatigue.",
  "A 32-year-old retail operations manager for a Milan department store with center-right views. Initially dismissed AI tools as hype but now secretly using them for inventory forecasting. Struggling with staff retention while his company refuses to increase wages despite record profits.",
  "A 26-year-old public relations specialist in Toronto with socially liberal, fiscally moderate views. Enthusiastically uses AI for media monitoring and content creation, sometimes passing the work off as her own to impress clients. Building her personal brand while dealing with chronic anxiety.",
  "A 25-year-old junior financial analyst in Brussels who avoids political identification entirely. Has basic AI tool exposure from training but rarely applies it, preferring traditional Excel models he trusts. Spends most evenings studying for financial certifications while friends focus on dating.",
  "A 33-year-old executive assistant in San Francisco with progressive politics who confidently incorporates AI tools into managing three executives' schedules and communications. Maintains a side photography business that's increasingly successful, creating internal conflict about her career path.",
  "A 27-year-old content coordinator at a Birmingham publishing company with traditional values and moderate conservative politics. Uses AI occasionally for editing but worries about its impact on authentic writing. Recently engaged and navigating the UK housing market with increasing despair.",
  "A 30-year-old HR manager in Copenhagen with social democratic views who strategically implements AI for recruitment screening against her older colleagues' resistance. Advocating for four-day workweeks while struggling to maintain boundaries in her own schedule.",
  "A 34-year-old office manager at an Austin tech startup with libertarian leanings. Initially AI-skeptical but now automating routine tasks to cope with chaotic startup demands. Raising two kids while his partner works nights, leading to constant exhaustion and career stagnation fears.",
  "A 28-year-old corporate event planner in Warsaw with conservative Catholic values who avoids AI tools, preferring personal touches and traditional methods. Meticulous in her work but increasingly frustrated by younger colleagues who cut corners with technology and still receive praise.",
  "A 26-year-old policy analyst at a London think tank with data-driven centrist views. Uses AI regularly for research summaries while carefully checking output against primary sources. Passionate about evidence-based policy but becoming disillusioned with how politics actually works.",
  "A 31-year-old marketing coordinator for a Chicago food company with progressive politics and an advanced understanding of AI tools which she integrates into campaigns. Recently returned from maternity leave to find her position partially automated, creating unspoken resentment toward technology.",
  "A 29-year-old paralegal at a Barcelona law firm with moderate views and growing curiosity about AI legal tools. Self-taught English speaker who translates documents for international clients. Contemplating law school but concerned about work-life balance after watching the firm's associates."
]

export default makeApiRoute({
  requireAuth: true,
  requestBody: requestSchema,
  responseBody: responseSchema,
}, async (body) => {
  const personaResponses = await Promise.all(personas.map(async (persona) => `Persona: ${persona}. Response: ` + await getPersonaOpinion(persona, body.text).catch((error: unknown) => `Failed to get response. Error: ${asError(error).message}`)))
  const summary = await getPersonaSummary(personaResponses)
  return {
    fullResponses: personaResponses,
    summary,
  }
});

const getPersonaOpinion = async (persona: string, text: string): Promise<string> => {
  return getClaudeResponse(`You are simulating the following persona reading the following reasoning. Explain their thoughts and feelings as they read through it, and what parts resonate most with them. Highlight where they might decide to stop reading or drop off.

<persona>
${persona}
</persona>

<reasoning>
${text}
</reasoning>`)
}

const getPersonaSummary = async (reflections: string[]): Promise<string> => {
  return getClaudeResponse(`Summarize the following reflections, identifying key themes and important insights. Suggest tweaks to the message to make it resonate more with people:

${reflections.join('\n\n')}`)
}

const getClaudeResponse = async (prompt: string): Promise<string> => {
  const response = await axios<{ content: { type: string, text?: string }[] }>({
    method: 'POST',
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    data: {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    },
  });

  if (!response.data.content[0]?.text) {
    throw new Error('Got non-text response from Claude')
  }

  return response.data.content[0].text;
}
