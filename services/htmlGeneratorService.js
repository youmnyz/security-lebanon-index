/**
 * HTML Generator Service
 * Generates rich HTML pages with charts, maps, RSS feeds, and SEO markup
 * Enhanced from original server-static.js
 */

const THREAT_COLORS = {
  'Extreme': { bg: '#991b1b', text: '#fef2f2', badge: '🚨' },
  'High': { bg: '#dc2626', text: '#fef2f2', badge: '⚠️' },
  'Elevated': { bg: '#ef4444', text: '#fef2f2', badge: '⚠️' },
  'Moderate': { bg: '#808080', text: '#ffffff', badge: '⚡' },
  'Low': { bg: '#404040', text: '#ffffff', badge: '✓' }
};

const RISK_CATEGORY_COLORS = {
  'Political': '#dc2626',
  'Economic': '#808080',
  'Security': '#991b1b',
  'Infrastructure': '#606060',
  'Civil': '#404040'
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
      <canvas id="threatGaugeChart" width="400" height="400"></canvas>
      <p class="chart-desc">Current security threat level on 0-100 scale</p>
    </div>

    <div class="chart-container">
      <h3>Risk Category Breakdown</h3>
      <canvas id="riskBreakdownChart" width="400" height="400"></canvas>
      <p class="chart-desc">Threat distribution by risk category</p>
    </div>

    <div class="chart-container">
      <h3>30-Day Threat Timeline</h3>
      <canvas id="timelineChart" width="600" height="300"></canvas>
      <p class="chart-desc">Historical threat level trends</p>
    </div>
  </div>
</section>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
<script>
// Direct chart initialization with retries
(function initializeCharts(retries) {
  retries = retries || 0;

  if (typeof Chart === 'undefined') {
    if (retries < 50) {
      setTimeout(() => initializeCharts(retries + 1), 100);
    }
    return;
  }

  try {
    // Threat Gauge Chart
    const threatGauge = document.getElementById('threatGaugeChart');
    if (threatGauge && !threatGauge.hasAttribute('data-chart-initialized')) {
      new Chart(threatGauge.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Current Threat', 'Safe'],
          datasets: [{
            data: [${assessment.threatScore || 50}, ${100 - (assessment.threatScore || 50)}],
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
      threatGauge.setAttribute('data-chart-initialized', 'true');
    }

    // Risk Breakdown Chart
    const riskBreakdown = document.getElementById('riskBreakdownChart');
    if (riskBreakdown && !riskBreakdown.hasAttribute('data-chart-initialized')) {
      const riskData = ${riskBreakdownJson};
      new Chart(riskBreakdown.getContext('2d'), {
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
      riskBreakdown.setAttribute('data-chart-initialized', 'true');
    }

    // Timeline Chart
    const timeline = document.getElementById('timelineChart');
    if (timeline && !timeline.hasAttribute('data-chart-initialized')) {
      const historicalScores = ${historicalScoresJson};
      new Chart(timeline.getContext('2d'), {
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
      timeline.setAttribute('data-chart-initialized', 'true');
    }
  } catch (err) {
    console.error('[CHARTS] Init error:', err);
  }
})();
</script>
  `;
}

function generateMapHTML() {
  return `
<section class="map-section">
  <h2>🗺️ Lebanon Security Map</h2>
  <div id="map" style="height: 500px; border-radius: 8px; margin-top: 20px;"></div>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
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
    .disclaimer-box {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 1.5rem;
      margin: 1.5rem 0;
      border-radius: 8px;
      color: #404040;
    }
    .disclaimer-box h3 {
      color: #991b1b;
      margin-bottom: 0.75rem;
    }
    .disclaimer-box p {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #606060;
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
    .feed-source h3 { color: #dc2626; margin-bottom: 1rem; }
    .feed-source ul { list-style: none; }
    .feed-source li { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
    .feed-source li:last-child { border-bottom: none; }
    .feed-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .severity-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
    .severity-badge.high { background: #fee2e2; color: #dc2626; }
    .severity-badge.medium { background: #fef3c7; color: #d97706; }
    .severity-badge.low { background: #dcfce7; color: #16a34a; }
    .feed-source a { color: #dc2626; text-decoration: none; font-weight: 500; display: block; }
    .feed-source a:hover { text-decoration: underline; }
    .feed-source p { color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem; }

    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .chart-container { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; }
    .chart-container canvas { display: block; }
    .chart-desc { color: #6b7280; font-size: 0.875rem; margin-top: 0.75rem; }

    .map-section { background: white; padding: 1.5rem; border-radius: 8px; }

    .key-risks-section { margin: 2rem 0; }
    .risks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 1rem 0; }
    .risk-card { background: white; padding: 1.5rem; border-left: 4px solid #ef4444; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .risk-category { color: #dc2626; margin-bottom: 0.75rem; font-size: 1.1rem; }
    .risk-description { color: #374151; margin-bottom: 0.75rem; }
    .risk-mitigation { color: #059669; font-size: 0.95rem; font-style: italic; }

    .top-threats-section { background: #fef2f2; padding: 1.5rem; border-left: 4px solid #dc2626; border-radius: 8px; margin: 2rem 0; }
    .threats-list { list-style: none; padding: 0; }
    .threats-list li { padding: 0.5rem 0; padding-left: 1.5rem; position: relative; }
    .threats-list li:before { content: "▸"; position: absolute; left: 0; color: #dc2626; font-weight: bold; }

    .threat-keywords-section { background: white; padding: 1.5rem; border-radius: 8px; margin: 2rem 0; }
    .keywords-cloud { margin: 1rem 0; }
    .keyword-tag { transition: all 0.2s; }
    .keyword-tag:hover { background: #0066cc; color: white; }

    footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem; }
    a { color: #dc2626; text-decoration: none; }
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

    <div class="disclaimer-box">
      <h3>⚠️ Disclaimer</h3>
      <p><strong>This assessment is for informational purposes only.</strong> The Lebanon Security Index provides analysis based on publicly available news, RSS feeds, and artificial intelligence. This information should not be considered official government assessment, legal advice, or a substitute for professional security consulting. All assessments are subject to change without notice based on evolving situations. ZodSecurity and its partners are not liable for any decisions made based on this information. Users should verify critical information through official government sources and professional security experts before making decisions.</p>
    </div>

    <div class="summary-box">
      <h2>Executive Summary</h2>
      <p>${sanitizeHtml(assessment.summary || 'Assessment being generated...')}</p>
      <p><strong>24-Hour Security Outlook:</strong> ${sanitizeHtml(assessment.outlook24h || 'No specific outlook available')}</p>
      <p><strong>Current Threat Score:</strong> <span style="font-size: 1.5rem; color: ${assessment.threatScore >= 75 ? '#dc2626' : assessment.threatScore >= 50 ? '#f97316' : '#10b981'}; font-weight: bold;">${assessment.threatScore}/100</span></p>
    </div>

    <section class="key-risks-section">
      <h2>🎯 Key Risk Factors Identified</h2>
      <div class="risks-grid">
        ${assessment.keyRisks?.map(risk => `
          <div class="risk-card">
            <h3 class="risk-category">${sanitizeHtml(risk.category)}</h3>
            <p class="risk-description"><strong>Risk:</strong> ${sanitizeHtml(risk.description)}</p>
            <p class="risk-mitigation"><strong>Mitigation Strategy:</strong> ${sanitizeHtml(risk.mitigation)}</p>
          </div>
        `).join('') || ''}
      </div>
    </section>

    <section class="top-threats-section">
      <h2>⚠️ Critical Threats</h2>
      <ul class="threats-list">
        ${assessment.topThreats?.map(threat => `<li>${sanitizeHtml(threat)}</li>`).join('') || ''}
      </ul>
    </section>

    <section class="threat-keywords-section">
      <h2>📊 Threat Intelligence Keywords</h2>
      <p>Analysis identified these critical security indicators:</p>
      <div class="keywords-cloud">
        ${Object.entries(assessment.threatKeywords || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([keyword, count]) => `
            <span class="keyword-tag" style="font-size: ${0.9 + count * 0.1}rem; padding: 0.5rem 1rem; margin: 0.25rem; background: #f0f9ff; border: 1px solid #0066cc; border-radius: 20px; display: inline-block;">
              ${sanitizeHtml(keyword)} <strong>(${count})</strong>
            </span>
          `).join('')}
      </div>
    </section>

    ${generateRSSFeedsHTML(feedsData)}
    ${generateChartsHTML(assessment)}
    ${generateMapHTML()}

    <footer style="border-top: 1px solid #e5e7eb; margin-top: 3rem; padding-top: 2rem;">
      <div style="margin-bottom: 1.5rem;">
        <p style="margin-bottom: 0.5rem;"><strong>ZodSecurity Services</strong></p>
        <p style="margin-bottom: 1rem;">
          <a href="https://zodsecurity.com/" style="margin-right: 1.5rem;">🏠 ZodSecurity</a>
          <a href="https://zodfire.com/" style="margin-right: 1.5rem;">🔥 ZodFire</a>
          <a href="https://zodsafe.com/" style="margin-right: 1.5rem;">🛡️ ZodSafe</a>
          <a href="https://zodprotection.com/" style="margin-right: 1.5rem;">🔒 ZodProtection</a>
        </p>
        <p>
          <a href="https://zodlightning.com/" style="margin-right: 1.5rem;">⚡ ZodLightning</a>
          <a href="https://zodentrance.com/" style="margin-right: 1.5rem;">🚪 ZodEntrance</a>
          <a href="https://zodsecurity.com/lebanon-security-index/" style="margin-right: 1.5rem;">📊 Security Index</a>
        </p>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; color: #6b7280; font-size: 0.9rem;">
        <p>Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Beirut' })} (Beirut Time)</p>
        <p>Data sources: National News Agency, Naharnet, BBC, Al Jazeera, Middle East Eye, Google News and others</p>
        <p style="margin-top: 1rem; color: #999;">© 2026 ZodSecurity. All rights reserved. | <a href="https://zodsecurity.com/">ZodSecurity.com</a></p>
      </div>
    </footer>
  </div>
</body>
</html>`;
}
