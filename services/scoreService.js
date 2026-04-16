/**
 * Security Score Service
 * Calculates threat levels based on news items and keywords
 * Reused from original server-static.js
 */

export function calculateSecurityScore(newsItems) {
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
      'evacuation', 'displacement', 'hostility', 'retaliation', 'retaliatory',
      'terror', 'terrorist', 'security', 'assassination', 'protest', 'riot'
    ];

    const itemText = `${item.title} ${item.summary || ''}`.toLowerCase();
    let itemConflictCount = 0;
    let keywordMatches = {};

    threatKeywords.forEach(keyword => {
      const matches = itemText.match(new RegExp(`\\b${keyword}\\b`, 'gi'));
      if (matches) {
        itemConflictCount += matches.length;
        keywordMatches[keyword] = (keywordMatches[keyword] || 0) + matches.length;
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

export function getThreatLevelFromScore(score) {
  if (score >= 90) return 'Extreme';
  if (score >= 75) return 'High';
  if (score >= 50) return 'Elevated';
  if (score >= 25) return 'Moderate';
  return 'Low';
}

export function analyzeThreatKeywords(newsItems) {
  const threatKeywords = [
    'attack', 'strike', 'airstrike', 'bombing', 'escalation', 'casualty', 'casualties',
    'killed', 'died', 'dead', 'war', 'conflict', 'military', 'armed', 'violence',
    'explosion', 'missile', 'drone', 'rocket', 'mortar', 'shelling', 'barrage',
    'injured', 'wounded', 'emergency', 'crisis', 'danger', 'threat', 'danger zone',
    'evacuation', 'displacement', 'hostility', 'retaliation', 'retaliatory',
    'terror', 'terrorist', 'security', 'assassination', 'protest', 'riot'
  ];

  const keywordCounts = {};

  newsItems.forEach(item => {
    const itemText = `${item.title} ${item.summary || ''}`.toLowerCase();
    threatKeywords.forEach(keyword => {
      const matches = itemText.match(new RegExp(`\\b${keyword}\\b`, 'gi'));
      if (matches) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + matches.length;
      }
    });
  });

  // Return top 10 keywords
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((acc, [key, val]) => {
      acc[key] = val;
      return acc;
    }, {});
}
