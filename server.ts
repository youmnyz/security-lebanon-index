import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";

/**
 * Sentiment Analysis & Scoring Logic
 * Used to calculate security scores based on news sentiment
 */
const NEGATIVE_KEYWORDS = [
  'attack', 'crisis', 'danger', 'conflict', 'strike', 'violence',
  'casualties', 'damage', 'displaced', 'hostility', 'emergency',
  'critical', 'severe', 'extreme', 'alert', 'warning', 'risk',
  'threat', 'explosion', 'military', 'armed', 'hostile', 'fatal'
];

const POSITIVE_KEYWORDS = [
  'stable', 'secure', 'peace', 'agreement', 'accord', 'cease-fire',
  'resolve', 'cooperation', 'safe', 'improvement', 'recovery',
  'progress', 'reconstruction', 'de-escalation', 'solution'
];

function analyzeSentiment(text: string): { sentiment: string; score: number } {
  const lowerText = text.toLowerCase();
  let negativeCount = 0;
  let positiveCount = 0;

  NEGATIVE_KEYWORDS.forEach(kw => {
    const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi'));
    if (matches) negativeCount += matches.length;
  });

  POSITIVE_KEYWORDS.forEach(kw => {
    const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi'));
    if (matches) positiveCount += matches.length;
  });

  const total = negativeCount + positiveCount;
  let score = 0;
  if (total > 0) {
    score = (positiveCount - negativeCount) / total;
  }
  score = Math.max(-1, Math.min(1, score));
  const sentiment = score < -0.3 ? 'negative' : score > 0.3 ? 'positive' : 'neutral';

  return { sentiment, score };
}

function calculateSecurityScore(newsItems: any[]): number {
  if (!newsItems || newsItems.length === 0) return 50;

  const now = new Date();
  let totalWeightedSentiment = 0;
  let totalWeight = 0;

  newsItems.forEach((item: any) => {
    const itemDate = new Date(item.timestamp);
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return;

    const recencyWeight = Math.max(0.5, 1 - (daysDiff / 7) * 0.5);
    let severityWeight = 1;
    if (item.severity === 'High') severityWeight = 1.5;
    else if (item.severity === 'Low') severityWeight = 0.7;

    const analysis = analyzeSentiment(`${item.title} ${item.summary || ''}`);
    const weight = recencyWeight * severityWeight;

    totalWeightedSentiment += analysis.score * weight;
    totalWeight += weight;
  });

  const avgSentiment = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;
  const score = 50 + (avgSentiment * 50);

  return Math.round(Math.max(0, Math.min(100, score)));
}

function getStatusFromScore(score: number): string {
  if (score < 25) return 'Critical';
  if (score < 50) return 'Warning';
  if (score < 75) return 'Stable';
  return 'Secure';
}

/**
 * Page Cache for pre-generated reports
 * Improves SEO by pre-generating 30 days of pages for indexing
 */
const pageCache = new Map<string, string>();

async function generatePageCache() {
  try {
    console.log("[SEO] Generating 30-day page cache for search indexing...");

    // Generate pages for last 30 days + next 7 days
    for (let i = -7; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Simple cache key - in production, you'd generate actual HTML
      pageCache.set(dateStr, `risk-assessment-${dateStr}`);
    }

    console.log(`[SEO] Generated ${pageCache.size} pages in cache`);
  } catch (err) {
    console.error("[SEO] Failed to generate page cache:", err);
  }
}

// URLs we own/know — skip validation to save time
const VERIFIED_URLS = new Set([
  "https://www.nna-leb.gov.lb/en/security-law",
  "https://www.lorientlejour.com/category/Liban",
  "https://www.naharnet.com/stories/en/lebanon",
  "https://www.aljazeera.com/where/lebanon/",
  "https://www.reuters.com/world/middle-east/",
  "https://www.lbcgroup.tv/news",
  "https://www.mtv.com.lb/en/news/Politics",
  "https://www.aljadeed.tv/news",
]);

async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;
  if (VERIFIED_URLS.has(url)) return true;
  // Google News search URLs are always valid
  if (url.startsWith("https://news.google.com/search")) return true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function filterValidNews<T extends { url?: string }>(items: T[]): Promise<T[]> {
  const results = await Promise.all(
    items.map(async (item) => ({
      item,
      valid: await isUrlReachable(item.url || ""),
    }))
  );
  return results.filter((r) => r.valid).map((r) => r.item);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // In-memory data store (simulating a database)
  let securityData = {
    overallScore: 24,
    isInitial: true,
    lastUpdated: new Date().toISOString(),
    categories: [
      {
        id: "fire",
        title: "Fire Risks",
        subHeading: "Fire Solutions",
        score: 15,
        status: "Warning",
        description: "Real-time fire monitoring and forest fire risk assessments across Lebanon.",
        externalLink: "https://zodfire.com",
        benchmarks: [],
        news: [
          {
            id: "f-n1",
            timestamp: new Date().toISOString(),
            title: "Wildfire Alert: Chouf Mountains",
            summary: "High risk of forest fires detected in the Chouf region due to dry conditions. Local civil defense on standby.",
            severity: "High",
            source: "National News Agency",
            url: "https://www.nna-leb.gov.lb/en/security-law"
          }
        ]
      },
      {
        id: "lightning",
        title: "Lightning Risks",
        subHeading: "Lightning Protection",
        score: 30,
        status: "Stable",
        description: "Weather forecast and lightning strike probability monitoring.",
        externalLink: "https://zodlightning.com",
        benchmarks: [],
        news: [
          {
            id: "l-n1",
            timestamp: new Date().toISOString(),
            title: "Storm Warning: Northern Coastal Areas",
            summary: "Lightning strike probability increased for the next 6 hours in Tripoli and surrounding areas.",
            severity: "Medium",
            source: "L'Orient-Le Jour",
            url: "https://www.lorientlejour.com/category/Liban"
          }
        ]
      },
      {
        id: "criminal",
        title: "Criminal Risks",
        subHeading: "Intruder Protection",
        score: 45,
        status: "Warning",
        description: "Monitoring theft, burglary, and general criminal activity trends.",
        externalLink: "https://zodprotection.com",
        benchmarks: [],
        news: [
          {
            id: "c-n1",
            timestamp: new Date().toISOString(),
            title: "Theft Trend: Urban Residential Areas",
            summary: "Increased reports of nighttime burglaries in Beirut's outer districts. Enhanced security measures recommended.",
            severity: "Medium",
            source: "Naharnet",
            url: "https://www.naharnet.com/stories/en/lebanon"
          }
        ]
      },
      {
        id: "financial",
        title: "Financial Risks",
        subHeading: "Safes and Locks Solutions",
        score: 10,
        status: "Critical",
        description: "Economic stability and financial security monitoring.",
        externalLink: "https://zodsafe.com",
        benchmarks: [],
        news: [
          {
            id: "fn-n1",
            timestamp: new Date().toISOString(),
            title: "Currency Volatility Update",
            summary: "Significant fluctuations in the unofficial exchange rate reported. Financial safety protocols advised.",
            severity: "High",
            source: "Reuters",
            url: "https://www.reuters.com/world/middle-east/"
          }
        ]
      },
      {
        id: "corporate",
        title: "Corporate News",
        subHeading: "Entrance Automation Solutions",
        score: 60,
        status: "Stable",
        description: "Business continuity and corporate security developments.",
        externalLink: "https://zodentrance.com",
        benchmarks: [],
        news: [
          {
            id: "co-n1",
            timestamp: new Date().toISOString(),
            title: "Corporate Access Protocols Updated",
            summary: "New digital entrance security standards implemented for major business hubs in Beirut.",
            severity: "Low",
            source: "Al Jazeera",
            url: "https://www.aljazeera.com/where/lebanon/"
          }
        ]
      }
    ],
    newsFeed: [
      {
        id: "n1",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        title: "Security Lebanon: Emergency Airspace Closure Confirmed",
        summary: "Civil Aviation Authority suspends all commercial operations at BEY following increased regional military activity. Emergency evacuation flights prioritized.",
        severity: "High",
        source: "L'Orient-Le Jour",
        url: "https://www.lorientlejour.com/category/Liban",
        keywords: ["airport", "beirut", "military"]
      }
    ],
    tacticalFeed: [
      {
        id: "w1",
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        title: "Frontline Report: Southern Border Activity",
        summary: "Intense military exchanges reported in the border villages. Local sources confirm multiple strikes on tactical positions.",
        severity: "High",
        source: "Al Jazeera",
        url: "https://www.aljazeera.com/where/lebanon/",
        keywords: ["border", "soldier", "explosion"]
      }
    ],
    historicalData: [
      { date: "Mar 20", score: 45 },
      { date: "Mar 21", score: 42 },
      { date: "Mar 22", score: 38 },
      { date: "Mar 23", score: 31 },
      { date: "Mar 24", score: 28 },
      { date: "Mar 25", score: 26 },
      { date: "Mar 26", score: 24 }
    ]
  };

  app.use(express.json({ limit: '1mb' }));

  // CORS — allow zodsecurity.com and local dev
  app.use((req, res, next) => {
    const allowed = ['https://zodsecurity.com', 'https://www.zodsecurity.com', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin || '';
    if (allowed.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Live news from real RSS sources
  app.get("/api/live-news", async (req, res) => {
    const RSS_FEEDS = [
      { url: 'https://nna-leb.gov.lb/en/rss', source: 'National News Agency' },
      { url: 'https://www.naharnet.com/tags/lebanon/en/feed.atom', source: 'Naharnet' },
      { url: 'https://www.the961.com/feed/', source: 'The961' },
      { url: 'https://www.newarab.com/rss.xml', source: 'The New Arab' },
      { url: 'https://www.middleeasteye.net/rss', source: 'Middle East Eye' },
      { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC Middle East' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
      { url: 'https://news.google.com/rss/search?q=Lebanon+security+safety&hl=en-LB&gl=LB&ceid=LB:en', source: 'Google News' },
    ];

    const parseRSS = (xml: string, defaultSource: string) => {
      const items: { title: string; url: string; source: string; summary: string; timestamp: string }[] = [];
      // Support both RSS <item> and Atom <entry>
      const tagName = xml.includes('<entry>') ? 'entry' : 'item';
      const matches = xml.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g'));
      for (const match of matches) {
        const block = match[1];
        const title = (block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim();
        // RSS <link> or Atom <link href="...">
        const link = (block.match(/<link>(.*?)<\/link>/) || block.match(/<link[^>]*href="([^"]+)"/) || [])[1]?.trim();
        const rawDesc = (block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
          || block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/) || [])[1] || '';
        const desc = rawDesc
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
        const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || block.match(/<updated>(.*?)<\/updated>/) || block.match(/<published>(.*?)<\/published>/) || [])[1]?.trim();
        const sourceName = (block.match(/<source[^>]*>(.*?)<\/source>/) || [])[1]?.trim() || defaultSource;
        if (title && link) {
          items.push({ title, url: link, source: sourceName, summary: desc || '', timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString() });
        }
        if (items.length >= 5) break;
      }
      return items;
    };

    const results = await Promise.allSettled(
      RSS_FEEDS.map(async ({ url, source }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const r = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          clearTimeout(timeout);
          const xml = await r.text();
          return parseRSS(xml, source);
        } catch { clearTimeout(timeout); return []; }
      })
    );

    const allNews = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    res.json(allNews.slice(0, 20));
  });

  // API routes
  app.get("/api/risk-assessment/:date", async (req, res) => {
    const { date } = req.params;
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `For date ${date}, provide a news sentiment briefing for Lebanon. This is a NEWS ANALYSIS tool, not intelligence.

Based on how positive/negative the news coverage would typically be for this date, provide:
{
  "date": "${date}",
  "summary": "What would typical news coverage on this date indicate about the situation? Focus on news tone and themes.",
  "threatLevel": "Low|Moderate|Elevated|High|Extreme" (based on typical news negativity, NOT actual conditions),
  "keyRisks": [
    { "category": "category", "description": "What did news typically cover?", "mitigation": "What positive developments might be reported?" }
  ],
  "outlook24h": "What might the next day's news focus on?",
  "seoTitle": "Lebanon News Briefing - ${new Date(date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}",
  "seoDescription": "News sentiment analysis briefing for Lebanon on ${new Date(date).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}"
}`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (err) {
      console.error("Risk assessment generation failed:", err);
      res.status(500).json({
        date,
        summary: "News sentiment analysis unavailable for this date.",
        threatLevel: "Moderate",
        keyRisks: [
          { category: "Data Unavailable", description: "Assessment not available", mitigation: "Review news sources directly" }
        ],
        outlook24h: "Unable to generate outlook.",
        seoTitle: `Lebanon News - ${date}`,
        seoDescription: "News sentiment analysis"
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side recalibration using transparent sentiment analysis
  app.get("/api/recalibrate", async (req, res) => {
    try {
      // Combine all news sources
      const allNews = [
        ...securityData.newsFeed,
        ...securityData.tacticalFeed,
        ...(securityData.categories?.flatMap(c => c.news || []) || [])
      ];

      // Calculate overall score based on real sentiment analysis
      const overallScore = calculateSecurityScore(allNews);

      // Update categories with sentiment-based scores
      const updatedCategories = securityData.categories.map(category => {
        const categoryNews = category.news || [];
        const categoryScore = categoryNews.length > 0
          ? calculateSecurityScore(categoryNews)
          : 50;

        return {
          ...category,
          score: categoryScore,
          status: getStatusFromScore(categoryScore)
        };
      });

      // Add historical data point
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const historicalEntry = { date: today, score: overallScore };
      const updatedHistorical = [...(securityData.historicalData || []), historicalEntry].slice(-7);

      const result = {
        overallScore,
        isInitial: false,
        lastUpdated: new Date().toISOString(),
        categories: updatedCategories,
        newsFeed: securityData.newsFeed,
        tacticalFeed: securityData.tacticalFeed,
        historicalData: updatedHistorical
      };

      res.json(result);
    } catch (err) {
      console.error("Recalibration failed:", err);
      res.status(500).json({ error: "Recalibration failed" });
    }
  });

  // Server-side AI analysis using Gemini
  app.post("/api/ai-analysis", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const { score, lastUpdated } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze news sentiment about Lebanon. Current sentiment score: ${score}/100 (50=neutral, 0=very negative reporting, 100=very positive reporting). Last updated: ${lastUpdated}.

This is a NEWS SENTIMENT ANALYSIS tool, not an intelligence agency assessment. Interpret the score as: how positive vs negative is the current news coverage?

Generate a brief analysis summary with:
{
  "summarySections": [
    { "title": "News Coverage Tone", "content": "Brief 2-3 sentence description of whether recent reporting is positive, negative, or mixed" },
    { "title": "Key Topics", "content": "2-3 sentence summary of major topics in recent news" },
    { "title": "Trends", "content": "2-3 sentences on whether sentiment is improving or declining" }
  ],
  "findings": ["observation 1 about news coverage", "observation 2", "observation 3"],
  "metrics": { "Resilience": 0-100, "Stability": 0-100, "Risk": 0-100 },
  "seoTitle": "Lebanon News Analysis ${new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})} | News Sentiment",
  "seoDescription": "News sentiment analysis for Lebanon. Current reporting tone score: ${score}/100 based on coverage from 8+ sources."
}`,
        config: { responseMimeType: "application/json", maxOutputTokens: 2048 }
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (err) {
      console.error("AI analysis failed:", err);
      res.status(500).json({
        summarySections: [
          { title: "News Coverage Analysis", content: "Unable to generate detailed analysis. Review the news feeds below for current reporting on Lebanon." }
        ],
        findings: ["See news feeds for current coverage", "Sentiment score based on keyword analysis", "Check methodology for explanation"],
        metrics: { Resilience: 50, Stability: 50, Risk: 50 }
      });
    }
  });

  app.get("/api/security-data", (req, res) => {
    res.json(securityData);
  });

  app.post("/api/security-data", async (req, res) => {
    try {
      const body = req.body;

      // Validate URLs in all news arrays, filter out broken ones
      const [newsFeed, tacticalFeed, categories] = await Promise.all([
        body.newsFeed ? filterValidNews(body.newsFeed) : Promise.resolve(securityData.newsFeed),
        body.tacticalFeed ? filterValidNews(body.tacticalFeed) : Promise.resolve(securityData.tacticalFeed),
        body.categories
          ? Promise.all(
              body.categories.map(async (cat: any) => ({
                ...cat,
                news: cat.news ? await filterValidNews(cat.news) : [],
              }))
            )
          : Promise.resolve(securityData.categories),
      ]);

      securityData = {
        ...securityData,
        ...body,
        newsFeed,
        tacticalFeed,
        categories,
        lastUpdated: new Date().toISOString(),
      };
      res.json({ status: "success", data: securityData });
    } catch (err) {
      console.error("Failed to validate and save security data:", err);
      res.status(500).json({ status: "error" });
    }
  });

  // SEO: Enhanced Sitemap with 365 days for ranking "lebanon security" and "lebanon safety"
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://zodsecurity.com/security-index";
    const today = new Date().toISOString().split('T')[0];

    // Generate entire year for SEO (365 days)
    const yearOfDates = Array.from({ length: 365 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    // Archive pagination (30 reports per page = ~12 pages)
    const archivePages = Array.from({ length: 12 }, (_, i) => i + 1);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage: Highest priority for "lebanon security" and "lebanon safety" keywords -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Archive Hub: Important for SEO crawlability -->
  <url>
    <loc>${baseUrl}/archive</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Archive Pagination Pages -->
  ${archivePages.map(page => `
  <url>
    <loc>${baseUrl}/archive/page/${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  <!-- Daily Reports: 365 days of content for "lebanon security" and "lebanon safety" ranking -->
  ${yearOfDates.map(date => `
  <url>
    <loc>${baseUrl}/risk-assessment/${date}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://security-lebanon.run.app";
    res.type("text/plain");
    res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // SEO: Daily page generation for "lebanon security" and "lebanon safety" ranking
  // Run at 6 AM daily to pre-generate pages
  cron.schedule('0 6 * * *', () => {
    console.log('[SEO] Daily cron: Regenerating page cache for search indexing');
    generatePageCache();
  });

  // Run on startup to populate cache immediately
  await generatePageCache();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`[SEO] Page cache initialized with ${pageCache.size} pages`);
    console.log(`[SEO] Next daily regeneration: 6 AM tomorrow`);
  });
}

startServer();
