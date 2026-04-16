/**
 * Lebanon Security Index Server
 * Complete rebuild with modular services
 * Generates static HTML pages cached for fast delivery
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import helmet from 'helmet';
import 'dotenv/config';

// Import services
import { calculateSecurityScore, getThreatLevelFromScore, analyzeThreatKeywords } from './services/scoreService.js';
import { fetchRSSFeeds, enrichNewsWithSeverity } from './services/rssService.js';
import { generateAssessment } from './services/groqService.js';
import { generateHTML } from './services/htmlGeneratorService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/lebanon-security-index';
const ASSESSMENTS_DIR = path.join(__dirname, 'public', 'risk-assessment');

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveAssessmentJSON(date, assessment) {
  ensureDir(ASSESSMENTS_DIR);
  const filePath = path.join(ASSESSMENTS_DIR, `${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(assessment, null, 2));
  console.log(`[SAVE] Assessment JSON: ${date}`);
}

function loadAssessmentJSON(date) {
  const filePath = path.join(ASSESSMENTS_DIR, `${date}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.warn(`[LOAD] Parse error for ${date}: ${err.message}`);
      return null;
    }
  }
  return null;
}

function saveAssessmentHTML(date, html) {
  ensureDir(ASSESSMENTS_DIR);
  const filePath = path.join(ASSESSMENTS_DIR, `${date}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`[SAVE] Assessment HTML: ${date}`);
}

function loadAssessmentHTML(date) {
  const filePath = path.join(ASSESSMENTS_DIR, `${date}.html`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return null;
}

function getAvailableAssessments() {
  ensureDir(ASSESSMENTS_DIR);
  const files = fs.readdirSync(ASSESSMENTS_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => f.replace('.json', ''))
    .sort()
    .reverse();
}

// ============================================================================
// DAILY GENERATION PIPELINE
// ============================================================================

async function runDailyGeneration() {
  try {
    console.log('[PIPELINE] Daily generation started');

    const today = new Date().toISOString().split('T')[0];
    const existing = loadAssessmentJSON(today);

    if (existing) {
      console.log(`[PIPELINE] Assessment already exists for ${today}`);
      return { status: 'skipped', message: 'Assessment already exists' };
    }

    // Step 1: Fetch RSS feeds
    console.log('[PIPELINE] Fetching RSS feeds...');
    const { feedsData, allNews } = await fetchRSSFeeds();
    const enrichedNews = enrichNewsWithSeverity(allNews);
    console.log(`[PIPELINE] Fetched ${enrichedNews.length} news items`);

    // Step 2: Calculate security score
    console.log('[PIPELINE] Calculating security score...');
    const threatScore = calculateSecurityScore(enrichedNews);
    const threatKeywords = analyzeThreatKeywords(enrichedNews);
    console.log(`[PIPELINE] Threat score: ${threatScore}`);

    // Step 3: Generate AI assessment
    console.log('[PIPELINE] Calling Groq for assessment...');
    const assessment = await generateAssessment(today, enrichedNews, threatScore);
    assessment.threatKeywords = threatKeywords;

    // Add historical data (load past 30 days)
    assessment.historicalScores = [];
    for (let i = 0; i < 30; i++) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);
      const pastDateStr = pastDate.toISOString().split('T')[0];
      const pastAssessment = loadAssessmentJSON(pastDateStr);
      if (pastAssessment) {
        assessment.historicalScores.unshift({
          date: pastDateStr,
          score: pastAssessment.threatScore || 50
        });
      }
    }

    console.log(`[PIPELINE] Assessment generated: ${assessment.threatLevel}`);

    // Step 4: Add feeds data to assessment
    assessment.rssFeeds = feedsData;

    // Step 5: Generate and save HTML
    console.log('[PIPELINE] Generating HTML...');
    const html = generateHTML(today, assessment, feedsData);
    saveAssessmentHTML(today, html);

    // Step 6: Save assessment JSON with feeds data
    saveAssessmentJSON(today, assessment);

    console.log(`[PIPELINE] Complete for ${today}`);
    return { status: 'success', date: today, threatLevel: assessment.threatLevel };
  } catch (err) {
    console.error('[PIPELINE] Generation failed:', err.message, err.stack);
    throw err;
  }
}

// ============================================================================
// CRON SCHEDULING
// ============================================================================

try {
  cron.schedule('0 7 * * *', async () => {
    try {
      await runDailyGeneration();
    } catch (err) {
      console.error('[CRON] Daily generation failed:', err.message);
    }
  }, {
    timezone: 'Asia/Beirut'
  });
  console.log('[CRON] Scheduled for 7 AM Beirut time daily');
} catch (err) {
  console.error('[CRON] Schedule failed:', err.message);
}

// ============================================================================
// ROUTES
// ============================================================================

// Root redirect
app.get('/', (req, res) => {
  console.log('[ROOT] Redirecting to ' + BASE_PATH + '/');
  res.redirect(301, BASE_PATH + '/');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Manual generation endpoint (for testing)
app.get('/generate', async (req, res) => {
  try {
    console.log('[MANUAL] Triggering generation');
    const result = await runDailyGeneration();
    res.json({ status: 'success', ...result });
  } catch (error) {
    console.error('[MANUAL] Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Homepage - Archive of all assessments
app.get(`${BASE_PATH}/`, (req, res) => {
  try {
    console.log('[HOMEPAGE] Loading archive');
    const assessments = getAvailableAssessments();

    const threatColors = {
      'Extreme': '#7c2d12',
      'High': '#dc2626',
      'Elevated': '#f97316',
      'Moderate': '#f59e0b',
      'Low': '#10b981'
    };

    const archiveHtml = assessments
      .map(date => {
        const assessment = loadAssessmentJSON(date);
        const color = threatColors[assessment?.threatLevel] || '#666';
        const dateObj = new Date(`${date}T00:00:00Z`);
        const formatted = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return `
          <div style="margin-bottom: 1rem; padding: 1rem; background: white; border-left: 4px solid ${color}; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <a href="${BASE_PATH}/risk-assessment/${date}" style="color: #0066cc; text-decoration: none; font-weight: 500;">
              ${formatted}
            </a>
            <span style="color: ${color}; font-weight: 600; margin-left: 1rem;">${assessment?.threatLevel || 'Unknown'}</span>
            <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">${(assessment?.summary || 'No summary').substring(0, 100)}...</p>
          </div>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lebanon Security Index | Real-Time Security & Safety Assessment</title>
  <meta name="description" content="Real-time security and safety assessment for Lebanon. Daily threat analysis using AI-powered intelligence. Track security risks, geopolitical threats, economic stability.">
  <meta name="keywords" content="security lebanon, safety lebanon, threat assessment, lebanon security news">
  <meta name="author" content="ZodSecurity">
  <link rel="canonical" href="https://zodsecurity.com${BASE_PATH}/">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Lebanon Security Index">
  <meta property="og:description" content="Real-time security assessment for Lebanon">
  <meta property="og:url" content="https://zodsecurity.com${BASE_PATH}/">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; color: #666; }
    .info-box {
      background: #dbeafe;
      border-left: 4px solid #0066cc;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem 0; }
    footer { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #666; font-size: 0.9rem; }
  </style>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Lebanon Security Index",
    "description": "Real-time security and safety assessment for Lebanon",
    "url": "https://zodsecurity.com${BASE_PATH}/",
    "areaServed": "LB",
    "keywords": ["security lebanon", "safety lebanon", "threat assessment"]
  }
  </script>
</head>
<body>
  <div class="container">
    <h1>Lebanon Security Index</h1>
    <p>Daily risk assessments based on real-time security intelligence</p>

    <div class="info-box">
      <p><strong>Latest Update:</strong> Daily assessments are generated at 7 AM Beirut time based on RSS feed intelligence and AI-powered analysis.</p>
    </div>

    <h2>Risk Assessment Archive</h2>
    ${archiveHtml || '<p style="color: #999;">No assessments available yet.</p>'}

    <footer>
      <p>Data sources: National News Agency, Naharnet, BBC, Al Jazeera, Middle East Eye, Google News, The961, The New Arab</p>
      <p>Analysis method: RSS feed intelligence + AI-powered security risk assessment using Groq API</p>
      <p>&copy; 2026 ZodSecurity. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error('[HOMEPAGE] Error:', err.message);
    res.status(500).send('<h1>Error loading homepage</h1>');
  }
});

// Individual assessment pages
app.get(`${BASE_PATH}/risk-assessment/:date`, (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send('<h1>Invalid date format</h1>');
    }

    // Try to load cached HTML
    let html = loadAssessmentHTML(date);
    if (html) {
      return res.send(html);
    }

    // Try to generate from JSON
    const assessment = loadAssessmentJSON(date);
    if (assessment) {
      // Reconstruct feedsData from assessment if available
      const feedsData = assessment.rssFeeds || {};
      html = generateHTML(date, assessment, feedsData);
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
  } catch (err) {
    console.error('[ASSESSMENT] Error:', err.message);
    res.status(500).send('<h1>Error loading assessment</h1>');
  }
});

// API Endpoints
app.get('/api/assessments', (req, res) => {
  try {
    const dates = getAvailableAssessments();
    const assessments = dates.map(date => {
      const assessment = loadAssessmentJSON(date);
      return { date, ...assessment };
    });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/assessment/:date', (req, res) => {
  try {
    const { date } = req.params;
    const assessment = loadAssessmentJSON(date);
    if (!assessment) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ status: 'error', message: err.message });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Lebanon Security Index Server`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Base Path: ${BASE_PATH}`);
  console.log(`Homepage: http://localhost:${PORT}${BASE_PATH}/`);
  console.log(`Daily Generation: 7 AM Beirut Time`);
  console.log(`Data Sources: 8 RSS feeds`);
  console.log(`Analysis: Groq API (llama-3.3-70b)`);
  console.log(`========================================\n`);

  // Verify directory
  try {
    ensureDir(ASSESSMENTS_DIR);
    console.log(`[STARTUP] Assessment directory ready`);
  } catch (err) {
    console.error(`[STARTUP] Directory error: ${err.message}`);
  }
});

server.on('error', (err) => {
  console.error('[SERVER] Fatal error:', err);
  process.exit(1);
});

export default app;
