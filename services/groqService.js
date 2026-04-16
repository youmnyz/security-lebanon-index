/**
 * Groq Service
 * AI-powered security analysis using Groq API
 * Reused and enhanced from original server-static.js
 */

export async function generateAssessment(date, newsItems, threatScore) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Filter recent news (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentNews = newsItems.filter(item => new Date(item.timestamp) > sevenDaysAgo);

  // Prepare news summary
  const newsSummary = recentNews.slice(0, 20).map((item, idx) =>
    `${idx + 1}. [${item.source}] ${item.title}\n   ${item.summary}`
  ).join('\n\n');

  const threatLevelGuidance = (() => {
    if (threatScore >= 90) return 'Extreme (score >= 90)';
    if (threatScore >= 75) return 'High (score 75-89)';
    if (threatScore >= 50) return 'Elevated (score 50-74)';
    if (threatScore >= 25) return 'Moderate (score 25-49)';
    return 'Low (score < 25)';
  })();

  const systemPrompt = `You are a security risk assessment analyst specializing in Lebanon's geopolitical and security landscape.
Analyze the provided news items and generate a structured security assessment.
Your response must be valid JSON only - no markdown formatting, no explanations outside the JSON.`;

  const userPrompt = `Date: ${date}
Current Security Score: ${threatScore}/100
Suggested Threat Level: ${threatLevelGuidance}

Recent News Items:
${newsSummary}

Analyze this information and return a JSON object with:
{
  "threatLevel": "Extreme|High|Elevated|Moderate|Low",
  "threatScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "keyRisks": [
    {
      "category": "Political Stability|Economic Security|Military Activity|Civil Unrest|Infrastructure",
      "description": "<brief description of the risk>",
      "mitigation": "<recommended mitigation strategy>"
    }
  ],
  "outlook24h": "<Expected developments in the next 24 hours>",
  "riskBreakdown": {
    "Political": <0-100>,
    "Economic": <0-100>,
    "Security": <0-100>,
    "Infrastructure": <0-100>,
    "Civil": <0-100>
  },
  "topThreats": ["<threat 1>", "<threat 2>", "<threat 3>"]
}`;

  try {
    const response = await groq.messages.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    // Extract and clean JSON response
    let content = response.choices[0]?.message?.content || '{}';

    // Strip markdown code blocks if present
    content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const assessment = JSON.parse(content);

    // Ensure all required fields exist
    return {
      date,
      threatLevel: assessment.threatLevel || 'Moderate',
      threatScore: assessment.threatScore ?? threatScore,
      summary: assessment.summary || 'Assessment generated',
      keyRisks: assessment.keyRisks || [],
      outlook24h: assessment.outlook24h || 'No specific outlook',
      riskBreakdown: assessment.riskBreakdown || {},
      topThreats: assessment.topThreats || [],
      newsCount: recentNews.length
    };
  } catch (err) {
    console.error('[GROQ] Assessment generation failed:', err.message);
    throw new Error(`Failed to generate assessment: ${err.message}`);
  }
}
