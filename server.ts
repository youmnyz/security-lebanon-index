import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { INITIAL_SECURITY_DATA } from "./src/constants";

/**
 * Sentiment Analysis & Scoring Logic
 * Used to calculate security scores based on news sentiment
 * Enhanced for conflict/wartime detection
 */
const NEGATIVE_KEYWORDS = [
  'attack', 'crisis', 'danger', 'conflict', 'strike', 'violence',
  'casualties', 'damage', 'displaced', 'hostility', 'emergency',
  'critical', 'severe', 'extreme', 'alert', 'warning', 'risk',
  'threat', 'explosion', 'military', 'armed', 'hostile', 'fatal',
  'escalation', 'war', 'fighting', 'fire', 'missile', 'drone',
  'bombing', 'shelling', 'refugee', 'evacuation', 'barrage',
  'injured', 'killed', 'deaths', 'injured', 'ceasefire violation',
  'airstrike', 'wounded', 'bombing', 'mortar', 'rocket',
  'retaliatory', 'retaliation', 'aggressive', 'deterioration',
  'tension', 'confrontation', 'standoff'
];

const POSITIVE_KEYWORDS = [
  'stable', 'secure', 'peace', 'agreement', 'accord', 'cease-fire',
  'resolve', 'cooperation', 'safe', 'improvement', 'recovery',
  'progress', 'reconstruction', 'de-escalation', 'solution',
  'ceasefire', 'truce', 'dialogue', 'talks', 'negotiation',
  'peaceful', 'resolution', 'settlement', 'de-escalate'
];

function analyzeSentiment(text: string): { sentiment: string; score: number } {
  const lowerText = text.toLowerCase();
  let negativeCount = 0;
  let positiveCount = 0;
  let warfareIndicators = 0;

  NEGATIVE_KEYWORDS.forEach(kw => {
    const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi'));
    if (matches) {
      const count = matches.length;
      negativeCount += count;
      // Warfare keywords get extra weight
      const warfareTerms = ['attack', 'strike', 'missile', 'drone', 'airstrike', 'bombing',
                           'shelling', 'barrage', 'rocket', 'mortar', 'killed', 'wounded',
                           'casualties', 'evacuation', 'escalation', 'war'];
      if (warfareTerms.includes(kw)) {
        warfareIndicators += count;
      }
    }
  });

  POSITIVE_KEYWORDS.forEach(kw => {
    const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi'));
    if (matches) positiveCount += matches.length;
  });

  const total = negativeCount + positiveCount;
  let score = 0;
  if (total > 0) {
    // More sensitive to negative sentiment: use ratio with wartime adjustment
    score = (positiveCount - negativeCount) / total;

    // Apply wartime multiplier: if warfare keywords are present, more negative
    if (warfareIndicators > 0) {
      const warfareWeight = Math.min(0.5, warfareIndicators * 0.1); // Cap at 0.5
      score = score - warfareWeight; // Push score more negative
    }
  }

  score = Math.max(-1, Math.min(1, score));
  const sentiment = score < -0.3 ? 'negative' : score > 0.3 ? 'positive' : 'neutral';

  return { sentiment, score };
}

function calculateSecurityScore(newsItems: any[]): number {
  if (!newsItems || newsItems.length === 0) return 45; // Baseline lowered from 50 for wartime context

  const now = new Date();
  let totalWeightedSentiment = 0;
  let totalWeight = 0;
  let conflictIndicators = 0;

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

    // Detect conflict keywords
    const conflictTerms = ['attack', 'strike', 'airstrike', 'bombing', 'escalation', 'casualt', 'killed', 'died', 'war'];
    const itemText = `${item.title} ${item.summary || ''}`.toLowerCase();
    conflictTerms.forEach(term => {
      if (itemText.includes(term)) conflictIndicators++;
    });
  });

  const avgSentiment = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;

  // Base score: map sentiment from [-1,1] to [0,100], with lower baseline
  let score = 50 + (avgSentiment * 40); // Reduced multiplier from 50 to 40

  // Apply conflict penalty: if warfare terminology detected, lower score further
  if (conflictIndicators > 0) {
    const conflictPenalty = Math.min(15, conflictIndicators * 3); // 3 points per conflict indicator
    score -= conflictPenalty;
  }

  // Overall floor for conflict situations: no higher than 55 if any conflict detected
  if (conflictIndicators > 0 && score > 55) {
    score = 55;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

function getStatusFromScore(score: number): string {
  if (score < 25) return 'Critical';
  if (score < 50) return 'Warning';
  if (score < 75) return 'Stable';
  return 'Secure';
}

/**
 * Category Keyword Mapping
 * Maps news items to security risk categories based on keywords
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fire: ['fire', 'wildfire', 'blaze', 'burn', 'burning', 'arson', 'firefight', 'fire department', 'extinguish', 'heat', 'smoke', 'evacuation', 'residential fire', 'building fire'],
  lightning: ['lightning', 'thunder', 'storm', 'weather', 'electrical hazard', 'power outage', 'blackout', 'voltage surge', 'electrical safety', 'meteorological', 'rain', 'wind'],
  criminal: ['crime', 'theft', 'robbery', 'burglary', 'criminal', 'police', 'arrest', 'suspect', 'perpetrator', 'investigation', 'prison', 'larceny', 'vandalism', 'fraud', 'assault (non-military)'],
  financial: ['economy', 'economic', 'currency', 'bank', 'banking', 'market', 'financial', 'trade', 'investment', 'exchange rate', 'inflation', 'business', 'commerce', 'lira', 'dollar', 'price'],
  corporate: ['business', 'company', 'corporate', 'enterprise', 'firm', 'office', 'building', 'facility', 'headquarters', 'infrastructure', 'automation', 'technology', 'digital', 'security system', 'access control']
};

/**
 * Categorize news items based on keyword matching
 */
function categorizeNews(item: { title: string; summary: string }, keywords: Record<string, string[]> = CATEGORY_KEYWORDS): string[] {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const matched: string[] = [];

  for (const [categoryId, categoryKeywords] of Object.entries(keywords)) {
    for (const keyword of categoryKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        matched.push(categoryId);
        break; // Don't add same category twice
      }
    }
  }

  return matched;
}

/**
 * Check if news item is about Lebanon
 */
function isAboutLebanon(item: { title: string; summary: string; url?: string }): boolean {
  const text = `${item.title} ${item.summary} ${item.url || ''}`.toLowerCase();
  const lebanonTerms = ['lebanon', 'beirut', 'tripoli', 'sidon', 'tyre', 'baalbek', 'lebanese', 'hezbollah', 'lira'];
  const irrelevantTerms = ['global', 'worldwide', 'international report', 'world news', 'us news', 'uk news', 'europe', 'asia', 'africa'];
  // Exclude articles primarily about other Middle Eastern countries
  const otherCountries = ['baghdad', 'iraq', 'syria', 'damascus', 'jordan', 'amman', 'israel', 'palestine', 'egypt', 'cairo', 'saudi', 'yemen', 'gulf', 'iran', 'tehran'];

  // Must contain at least one Lebanon reference
  const hasLebanon = lebanonTerms.some(term => text.includes(term));
  if (!hasLebanon) return false;

  // Should not be purely global content
  const isGlobal = irrelevantTerms.some(term => text.includes(term)) && !text.includes('lebanon');
  if (isGlobal) return false;

  // Reject if primarily about another country (title focus check)
  const titleText = item.title.toLowerCase();
  const primaryFocusOnOther = otherCountries.some(country => {
    const countryCount = (titleText.match(new RegExp(country, 'g')) || []).length;
    const lebanonCount = (titleText.match(/lebanon|beirut|tripoli/g) || []).length;
    return countryCount > 0 && lebanonCount === 0;
  });

  return !primaryFocusOnOther;
}

/**
 * Filter news by age - only include items within specified days
 */
function isWithinTimeWindow(timestamp: string | undefined, maxDays: number = 30): boolean {
  if (!timestamp) return true; // Include items without timestamp

  const itemDate = new Date(timestamp);
  if (isNaN(itemDate.getTime())) return true; // Include items with invalid dates

  const now = new Date();
  const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff >= 0 && daysDiff <= maxDays;
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

/**
 * Recalibrate security data with live news from RSS feeds
 * Fetches from multiple sources, filters by date, categorizes, and scores
 */
async function recalibrateWithLiveNews(securityData: any, currentRSSFetch?: any) {
  try {
    console.log("[NEWS] Recalibrating categories with live RSS news...");

    // Fetch live news from all RSS sources
    let allNews: any[] = [];

    // If called with existing fetch result, use it; otherwise fetch new
    if (currentRSSFetch) {
      allNews = currentRSSFetch;
    } else {
      // RSS fetching will happen in the /api/live-news endpoint
      // For now, we'll populate it there and reuse the data
      allNews = securityData.newsFeed || [];
    }

    // Filter news by 30-day window
    const recentNews = allNews.filter(item => isWithinTimeWindow(item.timestamp, 30));

    console.log(`[NEWS] Found ${recentNews.length} news items within 30-day window`);

    // Clear existing category news
    for (const category of securityData.categories || []) {
      category.news = [];
    }

    // Distribute news to categories using keyword matching
    for (const newsItem of recentNews) {
      const categoryMatches = categorizeNews(newsItem, CATEGORY_KEYWORDS);

      // Add to matched categories
      for (const categoryId of categoryMatches) {
        const category = (securityData.categories || []).find((c: any) => c.id === categoryId);
        if (category && category.news.length < 20) { // Limit to 20 items per category
          category.news.push(newsItem);
        }
      }
    }

    // Recalculate scores for each category
    for (const category of securityData.categories || []) {
      if (category.news && category.news.length > 0) {
        category.score = calculateSecurityScore(category.news);
        category.status = getStatusFromScore(category.score);
      } else {
        category.score = 50; // Neutral if no news
        category.status = 'Stable';
      }
    }

    // Recalculate overall score from all news
    securityData.overallScore = calculateSecurityScore(recentNews.length > 0 ? recentNews : []);
    securityData.lastUpdated = new Date().toISOString();

    console.log(`[NEWS] Recalibration complete. Overall score: ${securityData.overallScore}`);
    return securityData;
  } catch (err) {
    console.error("[NEWS] Error recalibrating news:", err);
    return securityData;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Cache for RSS news (5-10 minute TTL to avoid hammering feeds)
  let newsCache = { data: [] as any[], timestamp: 0, TTL: 5 * 60 * 1000 };

  // In-memory data store (simulating a database)
  let securityData = {
    ...INITIAL_SECURITY_DATA,
    newsFeed: [],
    tacticalFeed: [],
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

  // Live news from real RSS sources (with 30-day filtering and caching)
  app.get("/api/live-news", async (req, res) => {
    // Check cache first (5-10 min TTL)
    if (newsCache.data.length > 0 && Date.now() - newsCache.timestamp < newsCache.TTL) {
      console.log("[CACHE] Returning cached news (age: " + Math.round((Date.now() - newsCache.timestamp) / 1000) + "s)");
      return res.json(newsCache.data);
    }

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

    try {
      console.log("[NEWS] Fetching fresh news from RSS feeds...");
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

      // Filter to 30-day window
      const recentNews = allNews.filter(item => isWithinTimeWindow(item.timestamp, 30));
      const limited = recentNews.slice(0, 50);

      // Cache the results
      newsCache.data = limited;
      newsCache.timestamp = Date.now();

      console.log(`[NEWS] Fetched ${allNews.length} items, filtered to ${limited.length} recent items (30-day window)`);
      res.json(limited);
    } catch (err) {
      console.error("[NEWS] Error fetching RSS news:", err);
      res.json(newsCache.data.length > 0 ? newsCache.data : []);
    }
  });

  // API routes
  app.get("/api/risk-assessment/:date", async (req, res) => {
    const { date } = req.params;
    try {
      const { Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `For date ${date}, provide a news sentiment briefing for Lebanon. This is a NEWS ANALYSIS tool, not intelligence.

Based on how positive/negative the news coverage would typically be for this date, provide JSON format only (no markdown):
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
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });

      const content = response.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);
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
      const { Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
      const { score, lastUpdated } = req.body;

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Analyze Lebanon news coverage for security and safety topics. Current sentiment score: ${score}/100. Last updated: ${lastUpdated}.

This is a NEWS SENTIMENT ANALYSIS tool. Focus on: criminal activity, fire safety, economic stability, infrastructure security, and business operations.

Generate analysis in JSON format only (no markdown):
{
  "summarySections": [
    { "title": "Safety Coverage", "content": "2-3 sentences on recent Lebanon security and safety news tone" },
    { "title": "Key Security Issues", "content": "2-3 sentences on main security topics in news (crime, accidents, economic concerns, infrastructure)" },
    { "title": "Outlook", "content": "2-3 sentences on whether conditions appear improving or declining" }
  ],
  "findings": ["observation 1", "observation 2", "observation 3"],
  "metrics": { "Safety": 0-100, "Stability": 0-100, "Risk": 0-100 }
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });

      const content = response.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);
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

  app.get("/api/security-data", async (req, res) => {
    try {
      // Recalibrate with live news data before responding
      console.log("[API] /api/security-data request - recalibrating with live news");

      let liveNews = newsCache.data;

      // If cache is empty or expired, fetch fresh news
      if (liveNews.length === 0 || Date.now() - newsCache.timestamp >= newsCache.TTL) {
        console.log("[API] Cache empty or expired, fetching fresh RSS news...");

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
          const tagName = xml.includes('<entry>') ? 'entry' : 'item';
          const matches = xml.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g'));
          for (const match of matches) {
            const block = match[1];
            const title = (block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim();
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

        try {
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
          const recentNews = allNews.filter(item => isWithinTimeWindow(item.timestamp, 30));
          const lebanonNews = recentNews.filter(item => isAboutLebanon(item));
          liveNews = lebanonNews.slice(0, 50);

          // Cache the results
          newsCache.data = liveNews;
          newsCache.timestamp = Date.now();

          console.log(`[API] Fetched ${allNews.length} items, filtered to ${liveNews.length} recent items`);
        } catch (fetchErr) {
          console.error("[API] RSS fetch failed:", fetchErr);
          liveNews = newsCache.data.length > 0 ? newsCache.data : [];
        }
      }

      // Recalibrate security data with the live (or cached) news
      const updatedData = await recalibrateWithLiveNews(securityData, liveNews);

      res.json(updatedData);
    } catch (err) {
      console.error("[API] Error in /api/security-data:", err);
      res.json(securityData); // Fallback to current data
    }
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
