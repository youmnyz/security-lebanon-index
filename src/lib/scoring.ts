/**
 * Transparent Scoring Methodology
 *
 * This module calculates security indicators based on:
 * 1. News sentiment analysis from real RSS feeds
 * 2. Frequency of negative vs. positive reporting
 * 3. Geographic and sectoral distribution
 *
 * IMPORTANT: These are analytical indicators, not ground-truth assessments.
 * Scores reflect media coverage intensity, not definitive security reality.
 */

export interface SentimentAnalysis {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1, where -1 is very negative
  keywords: string[];
}

// Keywords indicating different threat levels
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

const NEUTRAL_KEYWORDS = [
  'report', 'statement', 'official', 'announced', 'said',
  'according', 'sources', 'confirmed', 'update', 'news'
];

/**
 * Analyze sentiment of a text
 * Returns a score from -1 (very negative) to +1 (very positive)
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();

  let negativeCount = 0;
  let positiveCount = 0;
  const foundKeywords: string[] = [];

  NEGATIVE_KEYWORDS.forEach(kw => {
    const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi'));
    if (matches) {
      negativeCount += matches.length;
      foundKeywords.push(kw);
    }
  });

  POSITIVE_KEYWORDS.forEach(kw => {
    const matches = lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi'));
    if (matches) {
      positiveCount += matches.length;
      foundKeywords.push(kw);
    }
  });

  // Calculate sentiment score
  const total = negativeCount + positiveCount;
  let score = 0;
  if (total > 0) {
    score = (positiveCount - negativeCount) / total;
  }

  // Clamp between -1 and 1
  score = Math.max(-1, Math.min(1, score));

  const sentiment = score < -0.3 ? 'negative' : score > 0.3 ? 'positive' : 'neutral';

  return {
    text: text.substring(0, 100),
    sentiment,
    score,
    keywords: [...new Set(foundKeywords)]
  };
}

/**
 * Calculate an overall security score from news items
 * Score: 0-100, where 0 is very unsafe and 100 is very safe
 *
 * Methodology:
 * - Average sentiment of recent news
 * - Weight by recency (newer news weighted heavier)
 * - Convert sentiment (-1 to 1) to safety score (0 to 100)
 */
export function calculateSecurityScore(newsItems: Array<{
  title: string;
  summary: string;
  timestamp: string;
  severity?: string;
}>, maxDays: number = 7): number {
  if (!newsItems || newsItems.length === 0) {
    return 50; // Neutral if no data
  }

  const now = new Date();
  let totalWeightedSentiment = 0;
  let totalWeight = 0;

  newsItems.forEach(item => {
    // Skip items older than maxDays
    const itemDate = new Date(item.timestamp);
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) return;

    // Weight by recency (recent items weighted more)
    const recencyWeight = Math.max(0.5, 1 - (daysDiff / maxDays) * 0.5);

    // Weight by severity if available
    let severityWeight = 1;
    if (item.severity === 'High') severityWeight = 1.5;
    else if (item.severity === 'Medium') severityWeight = 1;
    else if (item.severity === 'Low') severityWeight = 0.7;

    // Analyze sentiment
    const analysis = analyzeSentiment(`${item.title} ${item.summary}`);

    // Combine weights
    const weight = recencyWeight * severityWeight;
    totalWeightedSentiment += analysis.score * weight;
    totalWeight += weight;
  });

  // Calculate average sentiment
  const avgSentiment = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;

  // Convert sentiment (-1 to 1) to safety score (0 to 100)
  // sentiment -1 = score 0 (very unsafe)
  // sentiment 0 = score 50 (neutral)
  // sentiment 1 = score 100 (very safe)
  const score = 50 + (avgSentiment * 50);

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate category scores based on filtered news
 */
export function calculateCategoryScore(newsItems: Array<{
  title: string;
  summary: string;
  timestamp: string;
  severity?: string;
}>, categoryKeywords: string[]): number {
  const relevant = newsItems.filter(item => {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    return categoryKeywords.some(kw => text.includes(kw.toLowerCase()));
  });

  return calculateSecurityScore(relevant);
}

/**
 * Determine status badge based on score
 */
export function getStatusFromScore(score: number): 'Critical' | 'Warning' | 'Stable' | 'Secure' {
  if (score < 25) return 'Critical';
  if (score < 50) return 'Warning';
  if (score < 75) return 'Stable';
  return 'Secure';
}

/**
 * Get a transparent explanation of the score
 */
export function getScoreExplanation(score: number, itemCount: number, daysAnalyzed: number): string {
  return `Based on analysis of ${itemCount} news items from the past ${daysAnalyzed} days. Score reflects frequency and sentiment of security-related reporting.`;
}
