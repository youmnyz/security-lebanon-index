/**
 * HTML Generator Service
 * Generates rich HTML pages with charts, maps, RSS feeds, and SEO markup
 * Enhanced from original server-static.js
 */

const THREAT_COLORS = {
  'Extreme': { bg: '#7c2d12', text: '#fff7ed', badge: '🚨' },
  'High': { bg: '#dc2626', text: '#fef2f2', badge: '⚠️' },
  'Elevated': { bg: '#f97316', text: '#fff7ed', badge: '⚠️' },
  'Moderate': { bg: '#f59e0b', text: '#fffbeb', badge: '⚡' },
  'Low': { bg: '#10b981', text: '#f0fdf4', badge: '✓' }
};

const RISK_CATEGORY_COLORS = {
  'Political': '#3b82f6',
  'Economic': '#8b5cf6',
  'Security': '#ef4444',
  'Infrastructure': '#f59e0b',
  'Civil': '#06b6d4'
};

function sanitizeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateSchemata(date, assessment) {
  const dateObj = new Date(`${date}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': `Lebanon Security Assessment - ${formattedDate}`,
    'description': assessment.summary || 'Security assessment for Lebanon',
    'url': `https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}`,
    'datePublished': new Date(`${date}T07:00:00Z`).toISOString(),
    'dateModified': new Date().toISOString(),
    'author': {
      '@type': 'Organization',
      'name': 'ZodSecurity',
      'url': 'https://zodsecurity.com'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'ZodSecurity - Lebanon Security Index',
      'url': 'https://zodsecurity.com/lebanon-security-index/',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://zodsecurity.com/logo.png'
      }
    },
    'mainEntity': {
      '@type': 'Thing',
      'name': 'Lebanon Security Threat Level',
      'description': `Threat Level: ${assessment.threatLevel}`
    },
    'keywords': ['security lebanon', 'safety lebanon', 'threat assessment', 'lebanon security news'],
    'geo': {
      '@type': 'GeoShape',
      'name': 'Lebanon'
    }
  };

  return JSON.stringify(schema);
}

function generateRSSFeedsHTML(feedsData) {
  let html = '<section class="feeds-section">\n';
  html += '<h2>📰 Intelligence Sources</h2>\n';
  html += '<div class="feeds-grid">\n';

  Object.entries(feedsData).forEach(([source, items]) => {
    if (!items || items.length === 0) return;

    html += `<div class="feed-source" data-source="${sanitizeHtml(source)}">\n`;
    html += `<h3>${sanitizeHtml(source)}</h3>\n`;
    html += '<ul>\n';

    items.forEach(item => {
      const severity = item.severity || 'Low';
      const severityBadge = severity === 'High' ? '🔴' : severity === 'Medium' ? '🟡' : '🟢';
      html += `<li>\n`;
      html += `  <div class="feed-item-header">\n`;
      html += `    <span class="severity-badge ${severity.toLowerCase()}">${severityBadge} ${severity}</span>\n`;
      html += `    <time>${new Date(item.pubDate).toLocaleDateString()}</time>\n`;
      html += `  </div>\n`;
      html += `  <a href="${sanitizeHtml(item.link)}" target="_blank" rel="noopener noreferrer">\n`;
      html += `    ${sanitizeHtml(item.title)}\n`;
      html += `  </a>\n`;
      html += `  <p>${sanitizeHtml(item.summary)}</p>\n`;
      html += `</li>\n`;
    });

    html += '</ul>\n';
    html += '</div>\n';
  });

  html += '</div>\n';
  html += '</section>\n';

  return html;
}

function generateChartsHTML(assessment) {
  const threatKeywordsJson = JSON.stringify(assessment.threatKeywords || {});
  const riskBreakdownJson = JSON.stringify(assessment.riskBreakdown || {});
  const historicalScoresJson = JSON.stringify(assessment.historicalScores || []);

  return `
<section class="analysis-section">
  <h2>📊 Analysis & Visualizations</h2>

  <div class="charts-grid">
    <div class="chart-container">
      <h3>Threat Score Gauge</h3>
      <canvas id="threatGaugeChart"></canvas>
      <p class="chart-desc">Current security threat level on 0-100 scale</p>
    </div>

    <div class="chart-container">
      <h3>Risk Category Breakdown</h3>
      <canvas id="riskBreakdownChart"></canvas>
      <p class="chart-desc">Threat distribution by risk category</p>
    </div>

    <div class="chart-container">
      <h3>30-Day Threat Timeline</h3>
      <canvas id="timelineChart"></canvas>
      <p class="chart-desc">Historical threat level trends</p>
    </div>
  </div>
</section>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"><\/script>
<script>
// Threat Gauge Chart
const threatCtx = document.getElementById('threatGaugeChart').getContext('2d');
const threatScore = ${assessment.threatScore || 50};
new Chart(threatCtx, {
  type: 'doughnut',
  data: {
    labels: ['Current Threat', 'Safe'],
    datasets: [{
      data: [threatScore, 100 - threatScore],
      backgroundColor: ['#ef4444', '#e5e7eb'],
      borderColor: ['#dc2626', '#d1d5db'],
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, position: 'bottom' }
    }
  }
});

// Risk Breakdown Chart
const riskCtx = document.getElementById('riskBreakdownChart').getContext('2d');
const riskData = ${riskBreakdownJson};
new Chart(riskCtx, {
  type: 'pie',
  data: {
    labels: Object.keys(riskData),
    datasets: [{
      data: Object.values(riskData),
      backgroundColor: ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, position: 'bottom' }
    }
  }
});

// Timeline Chart
const timelineCtx = document.getElementById('timelineChart').getContext('2d');
const historicalScores = ${historicalScoresJson};
new Chart(timelineCtx, {
  type: 'line',
  data: {
    labels: historicalScores.map(d => d.date),
    datasets: [{
      label: 'Threat Score',
      data: historicalScores.map(d => d.score),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.3,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});
<\/script>
  `;
}

function generateMapHTML() {
  return `
<section class="map-section">
  <h2>🗺️ Lebanon Security Map</h2>
  <div id="map" style="height: 500px; border-radius: 8px; margin-top: 20px;"></div>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script>
const map = L.map('map').setView([33.8, 35.5], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Add Lebanon regions (simplified - would use full GeoJSON in production)
const lebanonRegions = [
  { name: 'Beirut', coords: [33.3157, 35.4747], threatLevel: 'Moderate' },
  { name: 'Mount Lebanon', coords: [33.6,35.55], threatLevel: 'Low' },
  { name: 'South Lebanon', coords: [33.3, 35.5], threatLevel: 'Elevated' },
  { name: 'Bekaa Valley', coords: [33.85, 35.9], threatLevel: 'High' },
  { name: 'North Lebanon', coords: [34.4, 35.9], threatLevel: 'Moderate' }
];

const threatColors = { 'Extreme': '#7c2d12', 'High': '#dc2626', 'Elevated': '#f97316', 'Moderate': '#f59e0b', 'Low': '#10b981' };

lebanonRegions.forEach(region => {
  L.circleMarker(region.coords, {
    radius: 20,
    fillColor: threatColors[region.threatLevel],
    color: '#000',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.7
  }).bindPopup(\`<b>\${region.name}</b><br>Threat: \${region.threatLevel}\`).addTo(map);
});
<\/script>
  `;
}

export function generateHTML(date, assessment, feedsData = {}) {
  const dateObj = new Date(`${date}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const threatLevel = assessment.threatLevel || 'Moderate';
  const colors = THREAT_COLORS[threatLevel] || THREAT_COLORS['Moderate'];
  const badge = colors.badge;

  const schemata = generateSchemata(date, assessment);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lebanon Security Assessment ${date} | Security Index</title>
  <meta name="description" content="${sanitizeHtml(assessment.summary || 'Real-time security assessment for Lebanon')}">
  <meta name="keywords" content="security lebanon, safety lebanon, threat assessment, lebanon security news">
  <meta name="author" content="ZodSecurity">
  <meta name="geo.placename" content="Lebanon">
  <meta name="geo.region" content="LB">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Lebanon Security Assessment ${date} | Security Index">
  <meta property="og:description" content="${sanitizeHtml(assessment.summary || 'Real-time security assessment')}">
  <meta property="og:url" content="https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}">
  <meta property="og:site_name" content="Lebanon Security Index">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Lebanon Security Assessment ${date}">
  <meta name="twitter:description" content="${sanitizeHtml(assessment.summary || 'Real-time security assessment')}">

  <link rel="canonical" href="https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}">
  <meta property="og:url" content="https://zodsecurity.com/lebanon-security-index/risk-assessment/${date}">

  <script type="application/ld+json">
  ${schemata}
  </script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header {
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      color: white;
      padding: 3rem 2rem;
      margin-bottom: 2rem;
      border-radius: 12px;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .threat-badge {
      display: inline-block;
      background-color: ${colors.bg};
      color: ${colors.text};
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 1rem;
    }
    .summary-box {
      background: white;
      padding: 1.5rem;
      border-left: 4px solid ${colors.bg};
      margin: 1.5rem 0;
      border-radius: 8px;
    }
    section { margin: 2rem 0; }
    h2 { font-size: 1.75rem; margin-bottom: 1rem; color: #1f2937; }
    h3 { font-size: 1.25rem; margin-bottom: 0.75rem; }

    .feeds-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .feed-source {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .feed-source h3 { color: #0066cc; margin-bottom: 1rem; }
    .feed-source ul { list-style: none; }
    .feed-source li { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
    .feed-source li:last-child { border-bottom: none; }
    .feed-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .severity-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
    .severity-badge.high { background: #fee2e2; color: #dc2626; }
    .severity-badge.medium { background: #fef3c7; color: #d97706; }
    .severity-badge.low { background: #dcfce7; color: #16a34a; }
    .feed-source a { color: #0066cc; text-decoration: none; font-weight: 500; display: block; }
    .feed-source a:hover { text-decoration: underline; }
    .feed-source p { color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem; }

    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .chart-container { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-desc { color: #6b7280; font-size: 0.875rem; margin-top: 0.75rem; }

    .map-section { background: white; padding: 1.5rem; border-radius: 8px; }
    footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${badge} Lebanon Security Index</h1>
      <p>Assessment for ${formattedDate}</p>
      <div class="threat-badge">${threatLevel}</div>
    </header>

    <div class="summary-box">
      <h2>Summary</h2>
      <p>${sanitizeHtml(assessment.summary || 'Assessment being generated...')}</p>
      <p><strong>24-Hour Outlook:</strong> ${sanitizeHtml(assessment.outlook24h || 'No specific outlook available')}</p>
    </div>

    ${generateRSSFeedsHTML(feedsData)}
    ${generateChartsHTML(assessment)}
    ${generateMapHTML()}

    <footer>
      <p>Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Beirut' })} (Beirut Time)</p>
      <p>Data sources: National News Agency, Naharnet, BBC, Al Jazeera, Middle East Eye, Google News and others</p>
      <p><a href="https://zodsecurity.com/lebanon-security-index/">← Back to Archive</a></p>
    </footer>
  </div>
</body>
</html>`;
}
