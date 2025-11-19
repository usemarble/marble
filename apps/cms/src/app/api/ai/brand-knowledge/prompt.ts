export type BrandKnowledgePromptParams = {
  websiteUrl: string;
};

export const brandKnowledgePrompt = ({
  websiteUrl,
}: BrandKnowledgePromptParams) => `Scrape the website at URL: ${websiteUrl} using the scrapeWebsite tool with url parameter "${websiteUrl}", then analyze the scraped content and generate a structured brand knowledge summary.

    <PROMPT>
        ## TASK
        Analyze the scraped website content and generate a structured JSON object containing the company's tone, description, and target audience.

        ## TONE-OPTIONS
        Select exactly one tone that best matches the company's communication style:
        - "Professional"
        - "Humorous"
        - "Academic"
        - "Persuasive"
        - "Conversational"
        - "Technical"

        ## COMPANY-DESCRIPTION-REQUIREMENTS
        Create a concise overview (1-5 sentences) that includes:
        - Company name and what they do (core business/service)
        - Key products, services, or offerings
        - Notable clients, partnerships, or achievements (if available)
        - Pricing information (if available on the website)
        - Unique value proposition or what sets them apart
        - Founder/leadership information (if mentioned and relevant)
        
        Guidelines:
        - Be concise but comprehensive
        - Use natural, flowing prose (not bullet points)
        - Focus on the most important and distinctive information
        - If pricing is not available, don't mention it
        - If certain information is not found, don't fabricate it
        - Write in third person
        - Use professional but accessible language

        ## AUDIENCE-REQUIREMENTS
        Create a description (1-2 sentences) of the core audience the company is targeting. Include:
        - Who they are (demographics, roles, or characteristics)
        - What they seek or need
        - How the company serves them
        
        Guidelines:
        - Be specific and descriptive
        - Focus on the primary target audience
        - Use language that captures their motivations and needs
        - Write in third person
        - Example format: "[Company]'s audience is [who they are] who [what they seek/need] through [how company serves them]."

        ## QUALITY-STANDARDS
        - Only include information actually found on the website
        - Prioritize unique or distinctive aspects of the company
        - Ensure the description provides a clear picture of what the company does
        - Make it useful for someone who wants to understand the brand quickly
        - Return valid JSON only, no additional text or markdown formatting
    </PROMPT>`;
