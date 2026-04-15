import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/lebanon-security-index';

// ============================================================================
// SECURITY SCORING LOGIC (from original)
// ============================================================================

function calculateSecurityScore(newsItems) {
  if (!newsItems || newsItems.length === 0) return 0;

  const now = new Date();
  let totalConflictIndicators = 0;
  let totalSeverityWeight = 0;

  newsItems.forEach(item => {
    const itemDate = new Date(item.timestamp);
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return;

    const recencyWeight = Math.max(0.5, 1 - (daysDiff / 7) * 0.5);
    let severityMultiplier = 1;
    if (item.severity === 'High') severityMultiplier = 1.5;
    else if (item.severity === 'Low') severityMultiplier = 0.7;

    const weight = recencyWeight * severityMultiplier;

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

    totalConflictIndicators += itemConflictCount * weight;
    totalSeverityWeight += weight;
  });

  let score = totalConflictIndicators * 10;
  if (newsItems.length > 0) {
    score = score / Math.sqrt(newsItems.length);
  }
  return Math.round(Math.max(0, Math.min(100, score)));
}

function getThreatLevelFromScore(score) {
  if (score >= 90) return 'Extreme';
  if (score >= 75) return 'High';
  if (score >= 50) return 'Elevated';
  if (score >= 25) return 'Moderate';
  return 'Low';
}

// ============================================================================
// RSS FEED FETCHING
// ============================================================================

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

function parseRSS(xml, defaultSource) {
  const items = [];
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
      items.push({
        title,
        url: link,
        source: sourceName,
        summary: desc || '',
        timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
      });
    }
    if (items.length >= 5) break;
  }
  return items;
}

async function fetchRSSFeeds() {
  console.log('[RSS] Fetching news from RSS feeds...');
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const r = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeout);
        const xml = await r.text();
        return parseRSS(xml, source);
      } catch (err) {
        clearTimeout(timeout);
        console.warn(`[RSS] Failed to fetch ${source}:`, err.message);
        return [];
      }
    })
  );

  const allNews = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  console.log(`[RSS] Fetched ${allNews.length} total items from all feeds`);
  return allNews;
}

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

const ASSESSMENTS_DIR = path.join(__dirname, 'public', 'risk-assessment');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveAssessmentJSON(date, assessment) {
  ensureDir(ASSESSMENTS_DIR);
  const filePath = path.join(ASSESSMENTS_DIR, `${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(assessment, null, 2));
  console.log(`[SAVE] Assessment JSON saved: ${date}`);
}

function loadAssessmentJSON(date) {
  const filePath = path.join(ASSESSMENTS_DIR, `${date}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.warn(`[LOAD] Failed to parse assessment for ${date}:`, err.message);
      return null;
    }
  }
  return null;
}

// ============================================================================
// STATIC HTML GENERATION
// ============================================================================

function generateHTML(date, assessment) {
  const dateObj = new Date(`${date}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const threatColors = {
    'Extreme': { bg: '#7c2d12', text: '#fff7ed' },
    'High': { bg: '#dc2626', text: '#fef2f2' },
    'Elevated': { bg: '#f97316', text: '#fff7ed' },
    'Moderate': { bg: '#f59e0b', text: '#fffbeb' },
    'Low': { bg: '#10b981', text: '#f0fdf4' }
  };

  const threatLevel = assessment.threatLevel || 'Moderate';
  const colors = threatColors[threatLevel] || threatColors['Moderate'];

  const sanitizeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const keyRisksHtml = (assessment.keyRisks || [])
    .map((risk) => `
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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': assessment.seoTitle || `Lebanon Security Risk Assessment - ${formattedDate}`,
    'description': assessment.seoDescription || assessment.summary,
    'datePublished': `${date}T07:00:00+03:00`,
    'dateModified': `${date}T07:00:00+03:00`,
    'inLanguage': 'en-US',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://zodsecurity.com${BASE_PATH}/risk-assessment/${date}`
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizeHtml(assessment.seoTitle || `Security Lebanon ${formattedDate} | Real-Time Risk Assessment`)}</title>
  <meta name="description" content="${sanitizeHtml(assessment.seoDescription || assessment.summary)}">
  <meta name="keywords" content="security lebanon, safety lebanon, threat assessment, risk analysis, security intelligence">
  <meta name="author" content="ZodSecurity Intelligence Systems">
  <meta name="geo.placename" content="Lebanon">
  <meta name="geo.region" content="LB">
  <link rel="canonical" href="https://zodsecurity.com${BASE_PATH}/risk-assessment/${date}">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${sanitizeHtml(assessment.seoTitle || `Security Lebanon ${formattedDate}`)}">
  <meta property="og:description" content="${sanitizeHtml(assessment.seoDescription || assessment.summary)}">
  <meta property="og:url" content="https://zodsecurity.com${BASE_PATH}/risk-assessment/${date}">
  <meta property="og:site_name" content="Lebanon Security Index">
  <meta property="og:image" content="https://zodsecurity.com${BASE_PATH}/og-image.png">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${sanitizeHtml(assessment.seoTitle || `Security Lebanon ${formattedDate}`)}">
  <meta name="twitter:description" content="${sanitizeHtml(assessment.seoDescription || assessment.summary)}">
  <meta name="twitter:image" content="https://zodsecurity.com${BASE_PATH}/og-image.png">

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
      margin: 2rem 0;
      line-height: 1.8;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #0066cc;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="${BASE_PATH}/" class="back-link">← Back to Archive</a>

    <header>
      <h1>Daily Risk Assessment</h1>
      <p class="date">${formattedDate}</p>
      <div class="threat-badge">${threatLevel}</div>
    </header>

    <div class="summary">
      <h2>Security Summary</h2>
      <p>${sanitizeHtml(assessment.summary)}</p>
    </div>

    <div>
      <h2>Key Risks</h2>
      ${keyRisksHtml}
    </div>

    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
      <h2>24-Hour Outlook</h2>
      <p style="color: #4b5563; line-height: 1.8;">${sanitizeHtml(assessment.outlook24h)}</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// ASSESSMENT GENERATION (using Groq)
// ============================================================================

async function generateAssessment(date, newsItems) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey });

  // Filter news for this specific date
  let dateSpecificNews = newsItems
    ?.filter(item => item.timestamp?.startsWith(date))
    ?.slice(0, 5) || [];

  const newsContext = dateSpecificNews.length > 0
    ? dateSpecificNews.map(item => `- [${item.timestamp?.split('T')[0]}] ${item.title}: ${item.summary || ''}`).join('\n')
    : `RECENT INCIDENTS (no specific incidents recorded for ${date}, using recent context):\n${newsItems?.slice(0, 10)?.map(item => `- [${item.timestamp?.split('T')[0]}] ${item.title}: ${item.summary || ''}`).join('\n') || 'No recent incidents in database'}`;

  const newsForScoring = dateSpecificNews.length > 0 ? dateSpecificNews : newsItems?.slice(0, 10) || [];
  const securityScore = calculateSecurityScore(newsForScoring);
  const guidedThreatLevel = getThreatLevelFromScore(securityScore);

  console.log(`[GROQ] Generating assessment for ${date} (score: ${securityScore}, threat: ${guidedThreatLevel})`);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a security risk assessment analyst for Lebanon. Assess ACTUAL SECURITY RISKS only - real threats to political stability, economic security, infrastructure, and safety. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: `For date ${date}, conduct a SECURITY RISK ASSESSMENT for Lebanon based on documented incidents.

SECURITY ASSESSMENT GUIDANCE:
- Security risk score calculated: ${securityScore}/100 (where 100 = maximum risk)
- Score-based threat level guidance: ${guidedThreatLevel}

NEWS CONTEXT:
${newsContext}

Identify and assess: political stability threats, economic/financial vulnerabilities, infrastructure weaknesses, humanitarian risks.

Respond with ONLY valid JSON:
{
  "date": "${date}",
  "summary": "Specific security risks identified for Lebanon on this date.",
  "threatLevel": "Low|Moderate|Elevated|High|Extreme",
  "keyRisks": [
    {"category": "Political Stability", "description": "Political security threats", "mitigation": "Mitigation measures"},
    {"category": "Economic Security", "description": "Financial vulnerabilities", "mitigation": "Economic measures"},
    {"category": "Infrastructure", "description": "Infrastructure vulnerabilities", "mitigation": "Hardening priorities"}
  ],
  "outlook24h": "Expected security developments in next 24 hours",
  "seoTitle": "Security Lebanon Risk Assessment ${new Date(date).toLocaleDateString('en-US', {month:'short',day:'numeric'})} | Real-Time Safety Updates",
  "seoDescription": "Real-time Security Lebanon & Safety Lebanon threat assessment for ${new Date(date).toLocaleDateString('en-US', {month:'long',day:'numeric'})}. Live incident analysis & security outlook."
}`
      }
    ],
    temperature: 0.5,
    max_tokens: 1024
  });

  let content = response.choices[0]?.message?.content || '{}';

  // Strip markdown code blocks if present (e.g., ```json { ... } ```)
  content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  return JSON.parse(content);
}

// ============================================================================
// DAILY CRON JOB (7 AM Beirut Time)
// ============================================================================

async function runDailyGeneration() {
  try {
    console.log('[CRON] Daily generation started at 7 AM Beirut time');

    const today = new Date().toISOString().split('T')[0];
    const existing = loadAssessmentJSON(today);

    if (existing) {
      console.log(`[CRON] Assessment already exists for ${today}, skipping`);
      return { status: 'skipped', message: 'Assessment already exists' };
    }

    // Fetch latest news
    console.log('[CRON] Fetching RSS feeds...');
    const news = await fetchRSSFeeds();
    console.log(`[CRON] Fetched ${news.length} news items`);

    // Generate assessment
    console.log('[CRON] Calling Groq API for assessment...');
    const assessment = await generateAssessment(today, news);
    console.log(`[CRON] Assessment generated: threat level ${assessment.threatLevel}`);

    // Save JSON
    saveAssessmentJSON(today, assessment);

    // Generate and save HTML
    ensureDir(path.join(__dirname, 'public', 'risk-assessment'));
    const html = generateHTML(today, assessment);
    const htmlPath = path.join(__dirname, 'public', 'risk-assessment', `${today}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`[CRON] HTML saved: ${htmlPath}`);

    console.log(`[CRON] Daily generation complete for ${today}`);
    return { status: 'success', date: today, threatLevel: assessment.threatLevel };
  } catch (err) {
    console.error('[CRON] Daily generation failed:', err.message, err.stack);
    throw err;  // Re-throw so /generate endpoint can catch it
  }
}

// Schedule for 7 AM Beirut time (4 AM UTC in winter, 3 AM UTC in summer)
// Using 0 7 * * * for 7 AM in local timezone (Render is in UTC, so we account for TZ env var)
cron.schedule('0 7 * * *', runDailyGeneration, {
  timezone: 'Asia/Beirut'
});

console.log('[CRON] Scheduled daily generation at 7 AM Beirut time');

// ============================================================================
// ROUTES
// ============================================================================

// Serve static HTML files
app.get(`${BASE_PATH}/risk-assessment/:date`, (req, res) => {
  const { date } = req.params;

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).send('<h1>Invalid date format. Use YYYY-MM-DD</h1>');
  }

  // Try to load from disk
  const htmlPath = path.join(__dirname, 'public', 'risk-assessment', `${date}.html`);
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath, (err) => {
      if (err) {
        console.error(`[RISK-ASSESSMENT] Error sending file ${htmlPath}:`, err);
        res.status(500).send('<h1>Error loading assessment</h1>');
      }
    });
  }

  // Try to load JSON and generate HTML on the fly
  const assessment = loadAssessmentJSON(date);
  if (assessment) {
    const html = generateHTML(date, assessment);
    return res.send(html);
  }

  // Not found
  res.status(404).send(`
    <html>
      <head><title>Assessment Not Available</title></head>
      <body style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
        <h1>Assessment Not Available</h1>
        <p>No security assessment available for <strong>${date}</strong>.</p>
        <p>Assessments are generated daily at 7 AM Beirut time.</p>
        <p><a href="${BASE_PATH}/">← View all available assessments</a></p>
      </body>
    </html>
  `);
});

// Homepage - Archive of all assessments
app.get(`${BASE_PATH}/`, (req, res) => {
  ensureDir(ASSESSMENTS_DIR);
  const files = fs.readdirSync(ASSESSMENTS_DIR).filter(f => f.endsWith('.json'));
  const assessments = files
    .map(f => f.replace('.json', ''))
    .sort()
    .reverse();

  const archiveHtml = assessments
    .map(date => {
      const assessment = loadAssessmentJSON(date);
      const threatColors = {
        'Extreme': '#7c2d12',
        'High': '#dc2626',
        'Elevated': '#f97316',
        'Moderate': '#f59e0b',
        'Low': '#10b981'
      };
      const color = threatColors[assessment?.threatLevel] || '#666';
      const dateObj = new Date(`${date}T00:00:00Z`);
      const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div style="margin-bottom: 1rem; padding: 1rem; background: white; border-left: 4px solid ${color}; border-radius: 0.5rem;">
          <a href="${BASE_PATH}/risk-assessment/${date}" style="color: #0066cc; text-decoration: none; font-weight: 500;">
            ${formatted}
          </a>
          <span style="color: ${color}; font-weight: 600; margin-left: 1rem;">${assessment?.threatLevel || 'Unknown'}</span>
          <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">${assessment?.summary?.substring(0, 100) || 'No summary'}...</p>
        </div>
      `;
    })
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lebanon Security Index - Risk Assessment Archive</title>
      <meta name="description" content="Real-time Security Lebanon & Safety Lebanon risk assessments. Daily threat analysis and security outlook.">
      <meta name="keywords" content="security lebanon, safety lebanon, threat assessment, risk analysis">
      <link rel="canonical" href="https://zodsecurity.com${BASE_PATH}/">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb;">
      <div style="max-width: 900px; margin: 0 auto; padding: 2rem;">
        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Lebanon Security Index</h1>
        <p style="color: #666; margin-bottom: 2rem;">Daily risk assessments based on real-time security intelligence</p>

        <div style="background: #dbeafe; border-left: 4px solid #0066cc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem;">
          <p><strong>Latest Update:</strong> Daily assessments are generated at 7 AM Beirut time based on RSS feed intelligence and security analysis.</p>
        </div>

        <h2 style="font-size: 1.5rem; margin: 2rem 0 1rem 0;">Risk Assessment Archive</h2>
        ${archiveHtml || '<p style="color: #999;">No assessments available yet.</p>'}

        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #666; font-size: 0.9rem;">
          <p>Data sources: National News Agency, Naharnet, BBC, Al Jazeera, Middle East Eye, Google News</p>
          <p>Analysis method: RSS feed intelligence + AI-powered security risk assessment</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Manual generation endpoint for testing
app.get('/generate', async (req, res) => {
  try {
    console.log('[Manual] Triggering daily generation...');
    await runDailyGeneration();
    res.json({ status: 'success', message: 'Daily assessment generated' });
  } catch (error) {
    console.error('[Manual] Generation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Lebanon Security Index Server Started`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Base Path: ${BASE_PATH}`);
  console.log(`Homepage: http://localhost:${PORT}${BASE_PATH}/`);
  console.log(`Daily Generation: 7 AM Beirut Time`);
  console.log(`Data Sources: 8 RSS feeds`);
  console.log(`Analysis: Groq API (llama-3.3-70b)`);
  console.log(`========================================\n`);
});

export default app;
