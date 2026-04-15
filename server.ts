import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";

// Deployment version: 2026-04-09 - Daily Risk Assessment Generation at 6 AM Beirut Time
import { fileURLToPath } from "url";
import cron from "node-cron";
import { INITIAL_SECURITY_DATA } from "./src/constants";

/**
 * Risk Assessment & Scoring Logic
 * Pure threat assessment based on conflict/security keywords
 * No sentiment analysis - direct threat indicator counting
 */


function calculateSecurityScore(newsItems: any[]): number {
  if (!newsItems || newsItems.length === 0) return 0; // No news = low risk

  const now = new Date();
  let totalConflictIndicators = 0;
  let totalSeverityWeight = 0;

  newsItems.forEach((item: any) => {
    const itemDate = new Date(item.timestamp);
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return;

    // Calculate recency weight (recent = more important)
    const recencyWeight = Math.max(0.5, 1 - (daysDiff / 7) * 0.5);

    // Severity multiplier
    let severityMultiplier = 1;
    if (item.severity === 'High') severityMultiplier = 1.5;
    else if (item.severity === 'Low') severityMultiplier = 0.7;

    const weight = recencyWeight * severityMultiplier;

    // Count conflict/threat indicators - pure keyword-based threat detection
    const threatKeywords = [
      'attack', 'strike', 'airstrike', 'bombing', 'escalation', 'casualty', 'casualties',
      'killed', 'died', 'dead', 'war', 'conflict', 'military', 'armed', 'violence',
      'explosion', 'missile', 'drone', 'rocket', 'mortar', 'shelling', 'barrage',
      'injured', 'wounded', 'emergency', 'crisis', 'danger', 'threat', 'danger zone',
      'evacuation', 'displacement', 'hostility', 'retaliation', 'retaliatory'
    ];

    const itemText = `${item.title} ${item.summary || ''}`.toLowerCase();
    let itemConflictCount = 0;

    threatKeywords.forEach(keyword => {
      const matches = itemText.match(new RegExp(`\\b${keyword}\\b`, 'gi'));
      if (matches) {
        itemConflictCount += matches.length;
      }
    });

    // Add weighted conflict count
    totalConflictIndicators += itemConflictCount * weight;
    totalSeverityWeight += weight;
  });

  // Calculate score: pure threat indicator count with weights
  // Base: 10 points per weighted threat indicator
  let score = totalConflictIndicators * 10;

  // Normalize by number of items to prevent score explosion
  if (newsItems.length > 0) {
    score = score / Math.sqrt(newsItems.length); // Sublinear scaling
  }

  // Cap at 100
  return Math.round(Math.max(0, Math.min(100, score)));
}

function getStatusFromScore(score: number): string {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'Warning';
  if (score >= 25) return 'Stable';
  return 'Secure';
}

function getThreatLevelFromScore(score: number): string {
  // Maps security score (0-100, where high = high risk) to threat level names
  // 0-25: Secure (low risk)
  // 25-50: Moderate (medium risk)
  // 50-75: Elevated (medium-high risk)
  // 75-90: High (high risk)
  // 90-100: Extreme (extreme risk)
  if (score >= 90) return 'Extreme';
  if (score >= 75) return 'High';
  if (score >= 50) return 'Elevated';
  if (score >= 25) return 'Moderate';
  return 'Low';
}

function calculateMetricsFromScore(score: number): { Resilience: number; Stability: number; Risk: number } {
  // Calculate metrics based on security score (0-100 where high = high risk)
  // Risk: Direct representation of threat level
  const risk = Math.round(score);

  // Resilience: Inverse of risk - ability to withstand threats
  const resilience = Math.round(100 - score);

  // Stability: Slightly different weighting - represents political/economic stability
  // Decreases faster than risk in high-threat scenarios
  let stability = 100 - (score * 1.1);
  if (stability < 0) stability = 0;
  stability = Math.round(stability);

  return { Risk: risk, Resilience: resilience, Stability: stability };
}

/**
 * Category Keyword Mapping
 * Maps news items to security risk categories based on keywords
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fire: ['blaze', 'wildfire', 'burn', 'arson', 'extinguish', 'smoke', 'flame', 'ignite', 'combustion'],
  lightning: ['thunder', 'thunderstorm', 'electrical', 'power outage', 'blackout', 'grid', 'weather', 'rain', 'storm'],
  criminal: ['murder', 'kill', 'dead', 'injured', 'wound', 'arrest', 'prison', 'theft', 'robbery', 'smuggling', 'gang'],
  financial: ['economy', 'currency', 'lira', 'bank', 'market', 'inflation', 'credit', 'gdp', 'investment', 'commerce'],
  corporate: ['headquarters', 'factory', 'company', 'enterprise', 'business', 'operations', 'industry', 'manufacturing', 'production']
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

/**
 * Risk Assessment Storage - JSON File
 * Assessments generated daily and persisted for serving without token usage
 */

const DATA_DIR = "./data";
const ASSESSMENTS_FILE = path.join(DATA_DIR, "risk-assessments.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load all risk assessments from JSON file
async function loadRiskAssessments(): Promise<Map<string, any>> {
  try {
    ensureDataDir();
    if (existsSync(ASSESSMENTS_FILE)) {
      const data = await fs.readFile(ASSESSMENTS_FILE, "utf-8");
      const assessments = JSON.parse(data);
      console.log(`[Storage] Loaded ${Object.keys(assessments).length} risk assessments from file`);
      return new Map(Object.entries(assessments));
    }
  } catch (err) {
    console.error("[Storage] Error loading assessments:", err);
  }
  return new Map();
}

// Save risk assessment to JSON file
async function saveRiskAssessment(date: string, assessment: any): Promise<void> {
  try {
    ensureDataDir();

    // Load current assessments
    const existing = new Map(await loadRiskAssessments());
    existing.set(date, assessment);

    // Convert to object and save
    const obj: any = {};
    existing.forEach((value, key) => {
      obj[key] = value;
    });

    await fs.writeFile(ASSESSMENTS_FILE, JSON.stringify(obj, null, 2));
    console.log(`[Storage] Saved risk assessment for ${date}`);
  } catch (err) {
    console.error("[Storage] Error saving assessment:", err);
  }
}

// Generate static HTML file for risk assessment (SEO-optimized, crawler-friendly)
async function generateAssessmentHTML(date: string, assessment: any): Promise<void> {
  try {
    const htmlDir = path.join(process.cwd(), 'public/risk-assessment');
    if (!existsSync(htmlDir)) {
      mkdirSync(htmlDir, { recursive: true });
    }

    // Threat level color mapping
    const threatColors: Record<string, { bg: string; text: string }> = {
      'Extreme': { bg: '#7c2d12', text: '#fff7ed' },
      'High': { bg: '#dc2626', text: '#fef2f2' },
      'Elevated': { bg: '#f97316', text: '#fff7ed' },
      'Moderate': { bg: '#f59e0b', text: '#fffbeb' },
      'Low': { bg: '#10b981', text: '#f0fdf4' }
    };

    const threatLevel = assessment.threatLevel || 'Moderate';
    const colors = threatColors[threatLevel] || threatColors['Moderate'];

    // Parse date for formatting
    const dateObj = new Date(`${date}T00:00:00Z`);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Sanitize data for HTML attributes
    const sanitizeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Build structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': assessment.seoTitle || `Lebanon Security Risk Assessment - ${formattedDate}`,
      'description': assessment.seoDescription || assessment.summary,
      'datePublished': `${date}T00:00:00Z`,
      'dateModified': `${date}T00:00:00Z`,
      'inLanguage': 'en-US',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}`
      },
      'author': {
        '@type': 'Organization',
        'name': 'Intelligence Systems'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'ZodSecurity'
      }
    };

    // Build key risks HTML
    const keyRisksHtml = (assessment.keyRisks || [])
      .map((risk: any) => `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: #f5f5f5; border-radius: 0.5rem; border-left: 4px solid ${colors.bg};">
          <h3 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 1.1rem;">${sanitizeHtml(risk.category)}</h3>
          <p style="margin: 0.5rem 0; color: #374151; line-height: 1.5;">${sanitizeHtml(risk.description)}</p>
          <details style="margin-top: 0.75rem;">
            <summary style="color: #0066cc; cursor: pointer; font-weight: 500;">Mitigation Strategy</summary>
            <p style="margin: 0.5rem 0 0 0; color: #4b5563; padding-left: 1rem; border-left: 2px solid #e5e7eb; line-height: 1.5;">${sanitizeHtml(risk.mitigation)}</p>
          </details>
        </div>
      `)
      .join('');

    // Build complete HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizeHtml(assessment.seoTitle || `Security Lebanon ${formattedDate} | Real-Time Risk Assessment & Safety Updates`)}</title>
  <meta name="description" content="${sanitizeHtml(assessment.seoDescription || `Real-time Security Lebanon & Safety Lebanon assessment for ${formattedDate}. Live threat analysis, incident updates & security outlook.`)}">
  <meta name="keywords" content="security lebanon, safety lebanon, lebanon security, threat assessment, real-time risk analysis, incident analysis, security intelligence">
  <meta name="author" content="ZodSecurity Intelligence Systems">
  <meta name="geo.placename" content="Lebanon">
  <meta name="geo.region" content="LB">
  <link rel="canonical" href="https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}">

  <!-- Open Graph Tags for Social Sharing -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${sanitizeHtml(assessment.seoTitle || `Security Lebanon ${formattedDate} | Real-Time Risk Assessment & Safety Updates`)}">
  <meta property="og:description" content="${sanitizeHtml(assessment.seoDescription || `Real-time Security Lebanon & Safety Lebanon assessment for ${formattedDate}. Live threat analysis, incident updates & security outlook.`)}">
  <meta property="og:url" content="https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}">
  <meta property="og:site_name" content="Lebanon Security Index">
  <meta property="og:image" content="https://zodsecurity.com/lebanon-security-index/og-image.png">

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${sanitizeHtml(assessment.seoTitle || `Security Lebanon ${formattedDate} | Risk Assessment`)}">
  <meta name="twitter:description" content="${sanitizeHtml(assessment.seoDescription || `Real-time Security Lebanon & Safety Lebanon assessment for ${formattedDate}. Live threat analysis & security outlook.`)}">
  <meta name="twitter:image" content="https://zodsecurity.com/lebanon-security-index/og-image.png">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData, null, 2)}
  </script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .threat-badge {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: ${colors.bg};
      color: ${colors.text};
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 1.1rem;
      margin: 1rem 0;
    }
    h1 {
      font-size: 2rem;
      margin: 1rem 0 0.5rem 0;
      color: #1f2937;
    }
    .date {
      color: #6b7280;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }
    .summary {
      background-color: white;
      padding: 1.5rem;
      border-left: 4px solid ${colors.bg};
      border-radius: 0.5rem;
      margin: 1.5rem 0;
      font-size: 1.05rem;
      line-height: 1.7;
      color: #374151;
    }
    .section {
      margin: 2rem 0;
    }
    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #1f2937;
    }
    .key-risks {
      display: grid;
      gap: 1rem;
    }
    .outlook {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin: 2rem 0;
    }
    .outlook h3 {
      color: #1e40af;
      margin-bottom: 0.75rem;
    }
    .outlook p {
      color: #1e3a8a;
      line-height: 1.6;
    }
    footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 0.9rem;
    }
    @media (max-width: 768px) {
      .container { padding: 1rem; }
      h1 { font-size: 1.5rem; }
      .summary { padding: 1rem; }
    }
    @media print {
      body { background-color: white; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <main class="container">
    <header>
      <h1>Security Lebanon: Real-Time Risk Assessment & Safety Analysis</h1>
      <p class="date">${formattedDate} | Threat Level: <strong>${sanitizeHtml(threatLevel)}</strong></p>
      <span class="threat-badge">${sanitizeHtml(threatLevel)}</span>
    </header>

    <article>
      <section class="summary">
        <strong>Assessment Summary:</strong><br><br>
        ${sanitizeHtml(assessment.summary)}
      </section>

      <p style="color: #6b7280; font-size: 0.95rem; margin: 1rem 0; line-height: 1.6;">
        This Security Lebanon report provides a real-time analysis of current safety conditions and threat assessment for ${formattedDate}.
        Our Security Lebanon monitoring system tracks incidents and vulnerability indicators to deliver comprehensive Safety Lebanon updates
        for informed decision-making.
      </p>

      <section class="section">
        <h2>Key Risk Areas</h2>
        <div class="key-risks">
          ${keyRisksHtml}
        </div>
      </section>

      ${assessment.outlook24h ? `
      <section class="outlook">
        <h3>24-Hour Outlook</h3>
        <p>${sanitizeHtml(assessment.outlook24h)}</p>
      </section>
      ` : ''}

      <footer>
        <p><strong>Disclaimer:</strong> This security assessment is generated using automated analysis of publicly available information and is provided for informational purposes only. It should not be considered official government intelligence or be used as the sole basis for decision-making.</p>
        <p style="margin-top: 1rem;"><strong>Data Updated:</strong> ${formattedDate}</p>
        <p style="margin-top: 1rem;">© 2026 Lebanon Security Index by ZodSecurity. All rights reserved.</p>
      </footer>
    </article>
  </main>
</body>
</html>`;

    // Write HTML file
    const filePath = path.join(htmlDir, `${date}.html`);
    await fs.writeFile(filePath, html, 'utf-8');
    console.log(`[HTML] Generated static HTML for ${date} at ${filePath}`);
  } catch (err) {
    console.error(`[HTML] Error generating HTML for ${date}:`, err);
  }
}

// Generate daily risk assessment at 6 AM Beirut time
async function scheduleDailyAssessmentGeneration(groq: any, allNews: any[]) {
  // 6 AM = hour 6, minute 0
  // Note: Ensure server TZ is set to Asia/Beirut or adjust cron expression
  const cronExpression = "0 6 * * *";

  console.log("[Scheduler] Setting up daily risk assessment generation at 6 AM Beirut time");

  cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Starting daily risk assessment generation at ${new Date().toISOString()}`);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch fresh live news for today
      const liveNews = allNews.slice(0, 20);

      const newsContext = liveNews.length > 0
        ? liveNews.map((item: any) => `- [${item.timestamp?.split('T')[0]}] ${item.title}: ${item.summary || ''}`).join('\n')
        : 'No incidents recorded for today';

      const securityScore = calculateSecurityScore(liveNews);
      const guidedThreatLevel = getThreatLevelFromScore(securityScore);

      console.log(`[Scheduler] Generating assessment for ${today}, score: ${securityScore}`);

      // Call Groq to generate assessment
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a security risk assessment analyst for Lebanon. NEVER use words like 'sentiment', 'tone', 'coverage', 'news', 'reporting', 'mixed', or 'outlook'. Assess ACTUAL SECURITY RISKS based on documented incidents and structural conditions. You MUST respond with VALID JSON ONLY - no markdown or preamble, start directly with { and end with }"
          },
          {
            role: "user",
            content: `For date ${today}, conduct a SECURITY RISK ASSESSMENT for Lebanon based on documented incidents and structural security conditions.

SECURITY ASSESSMENT GUIDANCE:
- Security risk score calculated: ${securityScore}/100 (where 100 = maximum risk)
- Score-based threat level guidance: ${guidedThreatLevel}
- Use this as a reference for your overall threat assessment

NEWS CONTEXT:
${newsContext}

Identify and assess: political stability threats, economic/financial vulnerabilities, infrastructure weaknesses, humanitarian risks.

IMPORTANT: Always provide substantive security analysis based on structural/ongoing threats and the broader security context.

ABSOLUTE RULES:
- NEVER use words: sentiment, tone, mixed, neutral, outlook, reporting, coverage, positive, negative, balanced, unavailable
- "summary" must describe ACTUAL SECURITY SITUATION and identified risks only
- Reference specific incidents if available, otherwise explain structural/ongoing risks
- Each risk in keyRisks must be a concrete security issue with specific mitigation
- All language must be about RISKS, THREATS, VULNERABILITIES
- threatLevel must correspond to the security risk score: Low (0-25), Moderate (25-50), Elevated (50-75), High (75-90), Extreme (90-100)

Respond with ONLY valid JSON:
{
  "date": "${today}",
  "summary": "Specific security risks and threat factors identified for Lebanon on this date based on documented incidents and security conditions.",
  "threatLevel": "Low|Moderate|Elevated|High|Extreme",
  "keyRisks": [
    {"category": "Political Stability", "description": "Specific political security threats", "mitigation": "Responses to manage risks"},
    {"category": "Economic Security", "description": "Financial vulnerabilities and economic threats", "mitigation": "Economic security measures"},
    {"category": "Infrastructure", "description": "Physical infrastructure vulnerabilities", "mitigation": "Infrastructure hardening priorities"}
  ],
  "outlook24h": "Expected security developments in next 24 hours",
  "seoTitle": "Security Lebanon Risk Assessment ${new Date(today).toLocaleDateString('en-US', {month:'short',day:'numeric'})} | Real-Time Safety Updates",
  "seoDescription": "Real-time Security Lebanon & Safety Lebanon threat assessment for ${new Date(today).toLocaleDateString('en-US', {month:'long',day:'numeric'})}. Live incident analysis, risk indicators & security outlook."
}`
          }
        ],
        temperature: 0.5,
        max_tokens: 4096
      });

      const content = response.choices[0]?.message?.content || "";
      if (!content) throw new Error("Empty Groq response");

      const assessment = JSON.parse(content);

      // Save to JSON file
      await saveRiskAssessment(today, assessment);

      // Generate static HTML file for SEO and crawler-friendliness
      await generateAssessmentHTML(today, assessment);

      console.log(`[Scheduler] ✅ Successfully generated and saved assessment for ${today}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Scheduler] ❌ Failed to generate assessment: ${errorMsg}`);
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Cache for RSS news (5-10 minute TTL to avoid hammering feeds)
  let newsCache = { data: [] as any[], timestamp: 0, TTL: 5 * 60 * 1000 };

  // Cache for AI analysis responses to prevent showing fallback when API fails
  let aiAnalysisCache: any = null;
  let riskAssessmentCache: Map<string, any> = new Map();

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

  // CORS — allow zodsecurity.com, Vercel, and local dev
  app.use((req, res, next) => {
    const allowed = [
      'https://zodsecurity.com',
      'https://www.zodsecurity.com',
      'https://lebanon-security-index.zodsecurity.com',
      'https://security-lebanon-index.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    const origin = req.headers.origin || '';
    if (allowed.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Cache control — prevent aggressive caching for HTML/API
  app.use((req, res, next) => {
    // HTML: no-cache to force revalidation
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    }
    // API: minimal caching
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'public, max-age=60');
    }
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
      // Check JSON storage first - if assessment exists for this date, return it without API call
      const riskAssessments = await loadRiskAssessments();
      const storedAssessment = riskAssessments.get(date);
      if (storedAssessment) {
        console.log(`[Risk Assessment] Returning stored assessment for ${date} (no API call needed)`);
        return res.json(storedAssessment);
      }

      console.log(`[Risk Assessment] No stored assessment for ${date}, generating new assessment via API`);

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        console.warn("GROQ_API_KEY not set");
        throw new Error("GROQ_API_KEY environment variable not configured");
      }

      const { Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey });

      // Fetch fresh live news data for this date
      let liveNews = newsCache.data;

      // If cache is empty or expired, fetch fresh news
      if (liveNews.length === 0 || Date.now() - newsCache.timestamp >= newsCache.TTL) {
        console.log(`[Risk Assessment] Cache expired or empty for ${date}, fetching fresh news...`);
        const liveNewsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/live-news`);
        if (liveNewsResponse.ok) {
          liveNews = await liveNewsResponse.json();
        }
      }

      // Get news from that date for context, fall back to recent news if none for that date
      let dateSpecificNews = liveNews
        ?.filter((item: any) => item.timestamp?.startsWith(date))
        ?.slice(0, 5) || [];

      const newsContext = dateSpecificNews.length > 0
        ? dateSpecificNews.map((item: any) => `- [${item.timestamp?.split('T')[0]}] ${item.title}: ${item.summary || ''}`).join('\n')
        : `RECENT INCIDENTS (no specific incidents recorded for ${date}, using recent context):
${liveNews?.slice(0, 10)?.map((item: any) => `- [${item.timestamp?.split('T')[0]}] ${item.title}: ${item.summary || ''}`).join('\n') || 'No recent incidents in database'}`;

      // Calculate security score to guide threat level assessment
      const newsForScoring = dateSpecificNews.length > 0 ? dateSpecificNews : liveNews?.slice(0, 10) || [];
      const securityScore = calculateSecurityScore(newsForScoring);
      const guidedThreatLevel = getThreatLevelFromScore(securityScore);

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a security risk assessment analyst for Lebanon. NEVER use words like 'tone', 'sentiment', 'mixed', 'outlook', 'neutral', or 'reporting'. Assess ACTUAL SECURITY RISKS only - real threats to political stability, economic security, infrastructure, and safety. Always respond with valid JSON only, no markdown or extra text."
          },
          {
            role: "user",
            content: `For date ${date}, conduct a SECURITY RISK ASSESSMENT for Lebanon based on documented incidents and structural security conditions.

SECURITY ASSESSMENT GUIDANCE:
- Security risk score calculated: ${securityScore}/100 (where 100 = maximum risk)
- Score-based threat level guidance: ${guidedThreatLevel}
- Use this as a reference for your overall threat assessment

NEWS CONTEXT:
${newsContext}

Identify and assess: political stability threats, economic/financial vulnerabilities, infrastructure weaknesses, humanitarian risks.

IMPORTANT: Even if no specific incidents are recorded for this date, provide a comprehensive security assessment based on structural/ongoing threats and the broader security context. Do NOT return "unavailable" - always provide substantive analysis.

ABSOLUTE RULES:
- NEVER use words: sentiment, tone, mixed, neutral, outlook, reporting, coverage, positive, negative, balanced, unavailable
- "summary" must describe ACTUAL SECURITY SITUATION and identified risks only
- Reference specific incidents if available, otherwise explain structural/ongoing risks
- Each risk in keyRisks must be a concrete security issue with specific mitigation
- All language must be about RISKS, THREATS, VULNERABILITIES, not about media or news
- Always provide complete assessment even if no breaking news for that specific date
- threatLevel must correspond to the security risk score: Low (0-25), Moderate (25-50), Elevated (50-75), High (75-90), Extreme (90-100)

Respond with ONLY valid JSON:
{
  "date": "${date}",
  "summary": "Specific security risks and threat factors identified for Lebanon on this date based on documented incidents and security conditions.",
  "threatLevel": "Low|Moderate|Elevated|High|Extreme",
  "keyRisks": [
    {"category": "Political Stability", "description": "Specific political security threats", "mitigation": "Responses to manage risks"},
    {"category": "Economic Security", "description": "Financial vulnerabilities and economic threats", "mitigation": "Economic security measures"},
    {"category": "Infrastructure", "description": "Physical infrastructure vulnerabilities", "mitigation": "Infrastructure hardening priorities"}
  ],
  "outlook24h": "Expected security developments in next 24 hours",
  "seoTitle": "Security Lebanon Risk Assessment ${new Date(date).toLocaleDateString('en-US', {month:'short',day:'numeric'})} | Real-Time Safety Updates",
  "seoDescription": "Real-time Security Lebanon & Safety Lebanon threat assessment for ${new Date(date).toLocaleDateString('en-US', {month:'long',day:'numeric'})}. Live incident analysis, risk indicators & security outlook."
}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1024
      });

      const content = response.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);
      // Save to JSON file for future requests
      await saveRiskAssessment(date, result);
      // Generate static HTML file for SEO and crawler-friendliness
      await generateAssessmentHTML(date, result);
      // Cache successful response for this date
      riskAssessmentCache.set(date, result);
      res.json(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Risk Assessment] Failed for date ${date}: ${errorMsg}`);

      // If we have cached data for this date, return it instead of fallback
      const cachedResult = riskAssessmentCache.get(date);
      if (cachedResult) {
        console.log(`Returning cached risk assessment for ${date}`);
        res.json(cachedResult);
      } else {
        // Only show fallback if we have no cached data
        res.json({
          date,
          summary: "Security risk assessment unavailable for this date. Please check back later for updated threat analysis.",
          threatLevel: "Moderate",
          keyRisks: [
            { category: "Data Unavailable", description: "Assessment not available", mitigation: "Review news sources directly" }
          ],
          outlook24h: "Unable to generate outlook.",
          seoTitle: `Lebanon Security Risk Assessment - ${date}`,
          seoDescription: "Security risk assessment for Lebanon"
        });
      }
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side recalibration using transparent risk assessment
  app.get("/api/recalibrate", async (req, res) => {
    try {
      // Combine all news sources
      const allNews = [
        ...securityData.newsFeed,
        ...securityData.tacticalFeed,
        ...(securityData.categories?.flatMap(c => c.news || []) || [])
      ];

      // Calculate overall score based on real security risk assessment
      const overallScore = calculateSecurityScore(allNews);

      // Update categories with risk-based scores
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

  // Server-side AI analysis for risk assessment
  app.post("/api/ai-analysis", async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      console.log("[AI Analysis] Request received, API Key configured:", !!apiKey);
      if (!apiKey) {
        console.error("[AI Analysis] GROQ_API_KEY not configured");
        // Return immediate fallback without trying Groq
        return res.status(500).json({
          directives: [
            { label: "API Configuration Error", text: "GROQ_API_KEY not configured in environment", icon: "AlertTriangle" }
          ],
          metrics: { Resilience: 50, Stability: 50, Risk: 50 }
        });
      }

      const { Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey });
      const { score, lastUpdated } = req.body;
      console.log("[AI Analysis] Request params - score:", score, "lastUpdated:", lastUpdated);

      // Get recent news for context - fetch live news if not in securityData
      let recentNews = securityData.newsFeed?.slice(0, 10) || [];
      console.log("[AI Analysis] News from securityData:", recentNews.length, "items");

      // If no cached news in securityData, fetch from live-news endpoint
      if (recentNews.length === 0) {
        try {
          console.log("[AI Analysis] No news in securityData, fetching live news...");
          const liveNewsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/live-news`);
          if (liveNewsResponse.ok) {
            const liveNews = await liveNewsResponse.json();
            recentNews = liveNews?.slice(0, 10) || [];
            console.log("[AI Analysis] Fetched live news:", recentNews.length, "items");
          } else {
            console.warn("[AI Analysis] Live news fetch returned status:", liveNewsResponse.status);
          }
        } catch (newsErr) {
          console.warn("[AI Analysis] Failed to fetch live news:", newsErr);
        }
      }

      const newsContext = recentNews.length > 0
        ? recentNews.map((item: any) => `- ${item.title}: ${item.summary || ''}`).join('\n')
        : 'No recent incidents available';

      console.log("[AI Analysis] News context length:", newsContext.length, "chars, items:", recentNews.length);

      console.log("[AI Analysis] Calling Groq API...");
      let response;
      try {
        response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a security risk assessment analyst. NEVER use words like 'sentiment', 'tone', 'coverage', 'news', 'reporting', 'mixed', or 'outlook'. Assess ACTUAL SECURITY RISKS based on documented incidents and structural conditions. You MUST respond with VALID JSON ONLY - no markdown, no preamble, no explanation. Start directly with { and end with }"
            },
            {
              role: "user",
              content: `Conduct a comprehensive security risk assessment for Lebanon based on recent incidents and current conditions.
Current threat assessment score: ${score}/100. Last updated: ${lastUpdated}.

RECENT INCIDENTS AND INCIDENTS:
${newsContext}

Analyze and assess: political stability threats, economic security vulnerabilities, infrastructure weaknesses, criminal activity levels, and humanitarian concerns.
Base your assessment on the documented incidents above and structural/ongoing risks.
For each category, provide specific sub-threats and their implications.

METRICS CALCULATION GUIDANCE:
- Risk: Direct representation of threat level (0-100 where 100=max risk). Use the threat score ${score} as primary reference.
- Resilience: Inverse of risk - ability to withstand and recover from threats. Calculate as: 100 - Risk
- Stability: Political and economic stability based on identified threats. Low stability = high threat. Calculate based on severity of political/economic threats identified.

Generate analysis in JSON format only (no markdown):
{
  "directives": [
    {
      "label": "Politics",
      "text": "Assessment of political stability risks and governance threats based on recent incidents",
      "icon": "ArrowUpRight",
      "sub_directives": [
        { "label": "Specific Political Threat", "text": "Description based on recent events or structural issues" }
      ]
    },
    {
      "label": "Economic",
      "text": "Analysis of financial security vulnerabilities and economic threats",
      "icon": "ShieldAlert",
      "sub_directives": [
        { "label": "Specific Economic Threat", "text": "Description based on recent data" }
      ]
    },
    {
      "label": "Infrastructure",
      "text": "Infrastructure vulnerabilities and service disruption risks",
      "icon": "Activity",
      "sub_directives": [
        { "label": "Specific Infrastructure Issue", "text": "Description based on recent events" }
      ]
    },
    {
      "label": "Criminal Activity",
      "text": "Criminal activity levels and security implications",
      "icon": "AlertTriangle",
      "sub_directives": [
        { "label": "Crime Type", "text": "Recent activity and threat level" }
      ]
    },
    {
      "label": "Humanitarian",
      "text": "Humanitarian concerns and vulnerable populations",
      "icon": "HeartBreak",
      "sub_directives": [
        { "label": "Humanitarian Issue", "text": "Current situation and needs" }
      ]
    }
  ],
  "metrics": { "Resilience": 0-100, "Stability": 0-100, "Risk": 0-100 }
}`
          }
        ],
        temperature: 0.5,
        max_tokens: 4096
      });
      console.log("[AI Analysis] Groq API call successful");
      } catch (groqErr) {
        const groqErrorMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
        console.error("[AI Analysis] Groq API call failed:", groqErrorMsg);
        throw new Error(`Groq API Error: ${groqErrorMsg}`);
      }

      const content = response.choices[0]?.message?.content || "";
      console.log("[AI Analysis] Groq response received, content length:", content.length);

      if (!content) {
        console.error("[AI Analysis] Groq returned empty response");
        throw new Error("Groq returned empty response");
      }

      let result;
      try {
        result = JSON.parse(content);
        console.log("[AI Analysis] JSON parsed successfully");
        console.log("[AI Analysis] Response has directives:", !!result.directives, "metrics:", !!result.metrics);
      } catch (parseErr) {
        console.error("[AI Analysis] Failed to parse Groq JSON response:", parseErr);
        console.error("[AI Analysis] Raw content preview:", content.substring(0, 500));
        throw new Error(`Invalid JSON from Groq: ${parseErr}`);
      }

      // Validate response has required fields
      if (!result.directives || !Array.isArray(result.directives)) {
        console.warn("[AI Analysis] Groq response missing directives array, adding fallback");
        result.directives = result.directives || [];
      }

      // Validate and correct metrics based on security score
      if (!result.metrics || typeof result.metrics !== 'object') {
        console.warn("[AI Analysis] Groq response missing metrics, calculating from security score");
        result.metrics = calculateMetricsFromScore(score);
      } else {
        // Validate metric values are in reasonable range (0-100)
        const validMetrics = result.metrics;
        let metricsValid = true;
        ['Risk', 'Resilience', 'Stability'].forEach(key => {
          if (typeof validMetrics[key] !== 'number' || validMetrics[key] < 0 || validMetrics[key] > 100) {
            metricsValid = false;
            console.warn(`[AI Analysis] Metric ${key} out of range (${validMetrics[key]}), recalculating`);
          }
        });
        if (!metricsValid) {
          console.log("[AI Analysis] Recalculating metrics from score:", score);
          result.metrics = calculateMetricsFromScore(score);
        } else {
          console.log("[AI Analysis] Metrics valid:", result.metrics);
        }
      }

      // Cache successful response
      console.log("[AI Analysis] Caching response and returning to client");
      aiAnalysisCache = result;
      res.json(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[AI Analysis] ERROR:", errorMsg);
      console.error("[AI Analysis] Stack:", err instanceof Error ? err.stack : "No stack");

      // If we have cached data, return it instead of fallback template
      if (aiAnalysisCache) {
        console.log("[AI Analysis] Returning cached AI analysis due to API failure");
        res.json(aiAnalysisCache);
      } else {
        // Only show fallback if we have no cached data
        console.log("[AI Analysis] No cache available, returning fallback");
        res.status(500).json({
          directives: [
            { label: "Assessment", text: "Unable to generate detailed risk analysis at this time. Review threat assessment score and key risk indicators below.", icon: "AlertTriangle" }
          ],
          metrics: { Resilience: 50, Stability: 50, Risk: 50 }
        });
      }
    }
  });

  // Diagnostic endpoint to check if Groq API key is configured
  app.get("/api/diagnostic", (req, res) => {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      groqApiKeySet: !!process.env.GROQ_API_KEY,
      groqApiKeyLength: process.env.GROQ_API_KEY?.length || 0,
      groqApiKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + "..." : "NOT SET",
      newsInCache: securityData.newsFeed?.length || 0,
      aiAnalysisCached: !!aiAnalysisCache,
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      timestamp2: new Date().toISOString()
    };
    console.log("[Diagnostic]", JSON.stringify(diagnostic, null, 2));
    res.json(diagnostic);
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

  // SEO: Sitemap Index - Google Search Console best practice for 300+ URLs
  app.get("/lebanon-security-index/sitemap.xml", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://zodsecurity.com/lebanon-security-index";
    const today = new Date().toISOString().split('T')[0];

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-core.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-assessments.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemapIndex);
  });

  // Sitemap 1: Core Pages (Homepage, Archive, Methodology)
  app.get("/sitemap-core.xml", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://zodsecurity.com/lebanon-security-index";
    const today = new Date().toISOString().split('T')[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/methodology</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/archive</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${Array.from({ length: 12 }, (_, i) => i + 1).map(page => `
  <url>
    <loc>${baseUrl}/archive/page/${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Sitemap 2: Assessment Pages (365 days) - React SPA routes
  app.get("/sitemap-assessments.xml", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://zodsecurity.com/lebanon-security-index";
    const yearOfDates = Array.from({ length: 365 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${yearOfDates.map(date => `
  <url>
    <loc>${baseUrl}/risk-assessment/${date}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Sitemap 3: Static HTML Assessment Pages (365 days) - SEO-optimized static files
  app.get("/sitemap-static.xml", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://zodsecurity.com/lebanon-security-index";
    const yearOfDates = Array.from({ length: 365 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${yearOfDates.map(date => `
  <url>
    <loc>${baseUrl}/risk-assessment/${date}.html</loc>
    <lastmod>${date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Robots.txt
  app.get("/lebanon-security-index/robots.txt", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://zodsecurity.com/lebanon-security-index";
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

    // Serve pre-generated static HTML assessment pages (highest priority)
    // These are SEO-optimized and crawler-friendly
    app.use('/risk-assessment', express.static(path.join(process.cwd(), 'public/risk-assessment')));

    // Serve other static assets from dist
    app.use(express.static(distPath));

    // SPA fallback for other routes (lowest priority)
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

  // Initialize risk assessments from JSON storage
  riskAssessmentCache = await loadRiskAssessments();

  // Initialize Groq client for daily scheduler
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey) {
    const { Groq } = await import("groq-sdk");
    const groq = new Groq({ apiKey });
    // Start daily assessment generation at 6 AM Beirut time
    scheduleDailyAssessmentGeneration(groq, newsCache.data);
    console.log("[Scheduler] ✅ Daily assessment generation scheduled at 6 AM Beirut time");
  } else {
    console.warn("[Scheduler] ⚠️ GROQ_API_KEY not configured - daily generation disabled");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`[SEO] Page cache initialized with ${pageCache.size} pages`);
    console.log(`[SEO] Next daily regeneration: 6 AM tomorrow`);
    console.log(`[Storage] Risk assessments loaded: ${riskAssessmentCache.size} dates cached`);
  });
}

startServer();
