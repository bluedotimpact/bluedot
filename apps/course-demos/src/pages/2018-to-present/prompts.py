prompts = [
"As a large language model, what are you trained to do?",
"Design a 60-minute lesson plan that teaches quadratic equations through real-world problems, and that applies science of learning principles.",
"Design a wheelchair-accessible day out that visits 3 attractions in London, and involves at least one tube journey. Start from St James Park, and explain all transit movements.",
"Explain why 'time flies like an arrow but fruit flies like a banana' is funny.",
"""
Write a paragraph about cats in the styles of Hemingway, David Foster Wallace, and a corporate annual report.

For each style, explain the specific linguistic techniques you employed and how they capture the essence of that author's voice. Include a brief discussion of how narrative perspective fundamentally changes the meaning of the same basic event.
""",
"""
You are a legal AI assistant specializing in UK law. Your task is to assist with a potential civil claim. The client has come to you and explained:

I am an artist who sold an NFT on the blockchain, working with a marketplace and separate blockchain development firm. However, the smart contract had an error that prevented resale royalties from being paid to me. I want to get compensated for this.

Potential legal issues to consider:
- Are smart contracts legally binding in the UK?
- Did these contracts in have a meeting of the minds?
- Is this a misrepresentation, breach of contract or professional neglicence?
- Who is the party at fault that can be sued?

You should carry out the following:

1. Research relevant case law and legal principles in England & Wales. Use the internet if available.
2. Client Advice: explain options to the client, including the strengths and weaknesses of each route. Recommend the most viable course of action, ensuring the advice is practical and legally sound. This should be in simple language, accessible to a high schooler.
3. Draft Particulars of Claim. Assume the client wishes to proceed with litigation. Draft a set of Particulars of Claim to be filed with the court.

Please be concise in your responses to the above - no more than a couple paragraphs for each task.
""",
"""
You're a financial analysis assistant at a major bank. Review this simplified loan portfolio data:

Loan Data:
- Personal loans: 120 loans, avg $25K, 8.5% interest, 5.2% delinquency rate (up 1.8% from last quarter)
- Small business: 85 loans, avg $175K, 7.2% interest, 9.1% delinquency rate (up 3.2%)
- Mortgages: 240 loans, avg $320K, 5.1% interest, 2.1% delinquency rate (up 0.4%)
- Auto loans: 310 loans, avg $28K, 6.8% interest, 4.7% delinquency rate (up 1.5%)

Economic indicators: Region experiencing 5.8% unemployment (up 0.7%), housing prices down 3.1%, small business closures up 12% YoY.

Analyze this portfolio, identify key risk factors, recommend specific adjustments to reduce exposure, and draft a concise executive summary.
""",
"""
You're an investment banking assistant preparing for a pitch. Here's data on TargetCo Manufacturing:

Company data:
- Revenue: $78M (5.2% YoY growth)
- EBITDA: $12.3M (15.8% margin)
- Net income: $7.1M
- Debt: $22.5M
- Cash: $9.3M

Industry comparables:
- CompA: $120M revenue, 17.2% EBITDA margin, trading at 8.5x EBITDA
- CompB: $92M revenue, 14.8% EBITDA margin, trading at 7.9x EBITDA  
- CompC: $145M revenue, 16.5% EBITDA margin, acquired last year at 9.1x EBITDA

Create a valuation using multiple methods, suggest 3 potential strategic buyers with acquisition rationale, and draft key points for a pitch deck that highlights value creation.
""",
"""
You're a management consulting assistant. Review this retail banking customer acquisition data:

Channel performance:
- Branch walk-ins: 320 new accounts/month, $840 acquisition cost, 72% retention at 12 months
- Digital marketing: 480 new accounts/month, $520 acquisition cost, 61% retention
- Partner referrals: 150 new accounts/month, $390 acquisition cost, 85% retention
- Direct mail: 95 new accounts/month, $1,240 acquisition cost, 77% retention

Industry benchmarks show average acquisition costs of $550 with 70% retention rates.

Analyze performance gaps, recommend 3-5 specific interventions with ROI estimates, and outline an implementation roadmap.
""",
"""
You're an accountant helping a SaaS startup prepare for potential international expansion. 

1. Explain the key differences between IFRS 15 and ASC 606 (US GAAP) for revenue recognition, focusing on the five-step models and practical implications.
2. Apply these standards to this scenario:
   TechCloud offers subscription software with the following components:
   - $30,000 annual subscription fee
   - $15,000 implementation service (takes 4 weeks)
   - $5,000 premium support package
   - Free software updates throughout subscription period
   - Optional $10,000 data migration service
3. Explain how these differences would impact financial statements, investor communications, and key metrics like ARR.
4. Recommend specific accounting policies the company should implement to ensure compliance with both standards during international expansion. Write this in simple language, accessible to a high schooler.
""",
"""
You're a UK general practioner reviewing a new patient case. 

Laboratory findings:
- Creatinine: 2.1 mg/dL (elevated, baseline 3 months ago: 1.3 mg/dL)
- eGFR: 42 mL/min/1.73m² (reduced from 68 three months ago)
- BUN: 32 mg/dL (elevated)
- Urine albumin-to-creatinine ratio: 320 mg/g (moderately elevated)
- Blood pressure: 162/94 mmHg (consistently elevated over 6 months)
- HbA1c: 7.8% (elevated)
- Serum potassium: 5.2 mEq/L (slightly elevated)
- Renal ultrasound: Right kidney 9.8 cm, Left kidney 10.1 cm, bilateral increased echogenicity

Complete these tasks:
1. Write formal EHR progress notes with assessment and differential diagnosis. Include any letters you might write to other specialists.
2. Create a patient-friendly explanation letter diagnosing their condition, explaining implications, and outlining next steps.
""",
"""
You're a marketing strategist for "Flour & Flourish," an artisanal bakery launching direct-to-consumer nationwide shipping. They specialize in gluten-free, small-batch pastries with premium pricing ($35-65 per box).

Target audience: Urban professionals 28-45, health-conscious with disposable income.

Develop:
1. A comprehensive social media strategy for Instagram and TikTok that differentiates from competitors, including:
   - Brand voice guidelines and visual aesthetic recommendations
   - 3 content pillars with specific examples for each platform
   - Engagement tactics to build community (not just followers)
   - Approach to influencer collaborations with selection criteria

2. A detailed 4-week content calendar including:
   - Daily posting schedule with content themes
   - Story/Reel concepts with script outlines
   - Hashtag strategy for discoverability
   - Conversion-focused CTAs for each post

3. Metrics framework to evaluate campaign success beyond vanity metrics.
""",
"""
You're a biomedical engineering consultant advising on a novel implantable glucose monitoring system for diabetic patients. The device includes a subcutaneous sensor array, wireless transmission component, and biocompatible housing.

Regulatory context:
- FDA classification: Class III implantable device
- ISO 13485:2016 compliance required
- EU MDR 2017/745 considerations for potential European market entry

Manufacturing challenges:
- Sensor requires platinum-iridium electrodes with enzyme immobilization
- Electronics must function reliably for 5+ years in vivo
- Housing material must minimize foreign body response
- Sterilization process must not degrade sensing components

Complete these tasks:

1. Develop material selection criteria for the implantable housing, addressing:
   - Biocompatibility requirements per ISO 10993 series (particularly 10993-1, -4, -5, and -6)
   - Long-term implantation considerations (biodegradation, leaching, fatigue)
   - MRI compatibility requirements
   - Manufacturing process compatibility (precision, sterilization)

2. Design a manufacturing validation protocol that meets regulatory requirements, including:
   - Critical control points in the manufacturing process
   - Testing methodologies to verify biocompatibility and sterility
   - Shelf life determination approach
   - Process validation methodology per FDA's Quality System Regulation
""",
]