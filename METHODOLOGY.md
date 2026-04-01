# Lebanon News Index - Methodology & Transparency

## Overview

The Lebanon News Index is a **news sentiment analysis tool**, not an intelligence agency assessment. It analyzes real-time news coverage from 8+ international sources to track how positive or negative reporting about Lebanon trends over time.

## Important Disclaimer

This tool reflects **what news sources are reporting**, not necessarily ground-truth security conditions. Underreported areas will show artificially positive scores. This is a media analysis tool, not an operational security assessment.

## Data Sources

The index pulls from the following RSS feeds:

1. **National News Agency (NNA)** - Lebanese official news
2. **Naharnet** - Lebanese news
3. **The961** - Lebanese news
4. **New Arab** - Regional coverage
5. **Middle East Eye** - Regional analysis
6. **BBC Middle East** - International coverage
7. **Al Jazeera** - International coverage
8. **Google News** - Aggregated Lebanon search results

All feeds are fetched in real-time (updated when you click "Update" or reload the page).

## Scoring Methodology

### How Scores Are Calculated

**Step 1: Sentiment Analysis**
- Each news article's title and summary are analyzed for keywords
- Negative keywords: attack, crisis, danger, conflict, strike, violence, casualties, damage, displaced, hostility, emergency, critical, severe, extreme, alert, warning, risk, threat, explosion, military, armed, hostile, fatal
- Positive keywords: stable, secure, peace, agreement, accord, cease-fire, resolve, cooperation, safe, improvement, recovery, progress, reconstruction, de-escalation, solution

**Step 2: Weighting**
- Articles are weighted by recency: newer articles count more heavily
- Severity tags (High/Medium/Low) affect weight: High severity = 1.5x weight, Medium = 1.0x, Low = 0.7x
- Articles older than 7 days are excluded

**Step 3: Aggregation**
- Weighted sentiments are averaged
- Sentiment score ranges from -1 (very negative reporting) to +1 (very positive reporting)

**Step 4: Conversion**
- Sentiment score is converted to 0-100 scale:
  - -1 sentiment → 0 score (very negative coverage)
  - 0 sentiment → 50 score (balanced coverage)
  - +1 sentiment → 100 score (very positive coverage)

### Score Interpretation

| Score | Status | Meaning |
|-------|--------|---------|
| 0-25 | Critical | Heavy negative reporting with urgent language |
| 25-50 | Warning | Mixed reporting with concerning developments |
| 50-75 | Stable | Generally balanced reporting with some improvements |
| 75-100 | Secure | Predominantly positive reporting |

**Note:** A score of 50 means news coverage is balanced (neither positive nor negative). This is normal and expected for routine reporting.

## Categories

The index tracks five reporting categories:

1. **Political Stability** - Government, parliament, and governance reporting
2. **Economic Conditions** - Currency, markets, and financial news
3. **Infrastructure & Services** - Utilities, telecommunications, electricity
4. **Humanitarian Concerns** - Aid, displacement, healthcare, welfare
5. **Regional Developments** - Regional geopolitical reporting

Each category is scored independently using the same methodology on category-relevant articles only.

## Historical Data

The index tracks 7 days of historical scores to show trends in reporting sentiment. A declining score means reporting is becoming more negative; an improving score means reporting is becoming more positive.

## Limitations

### Media Bias
This index reflects **news coverage patterns**, not actual conditions. Areas with more international media presence will have more complete coverage. Underreported crises will show artificially positive scores.

### Language Coverage
Only English-language sources are included. Arabic and French reporting may have different perspectives or emphasis.

### Reporting Lag
News reporting lags behind actual events. Scores represent what happened and was reported, not real-time conditions.

### Not Operational Intelligence
- This is NOT a military assessment
- This is NOT a police intelligence report
- This is NOT a government security assessment
- This is a public-facing analytical tool

### Sentiment Analysis Limitations
Keyword-based sentiment analysis is imperfect. Context matters. A "security alert" might be negative (threat) or positive (proactive measure). The algorithm can miss nuance.

## What This Tool IS Good For

✓ **Trending:** See if news coverage is becoming more positive/negative over time
✓ **Comparative:** Compare coverage of different sectors (political vs economic)
✓ **Research:** Understand what's being reported about Lebanon
✓ **Educational:** Learn about current events in Lebanon from multiple sources

## What This Tool IS NOT Good For

✗ Making operational security decisions
✗ Assessing actual threat levels
✗ Intelligence analysis
✗ Replacing professional analysis
✗ Making investment decisions

## Updates & Recalibration

The index recalculates whenever you:
- Load the home page
- Click "Update"
- Refresh the browser

Each recalibration:
1. Fetches latest RSS feeds
2. Analyzes sentiment of recent articles
3. Recalculates scores
4. Updates historical trend

This ensures you're always seeing current reporting.

## Technical Details

- **Algorithm:** Weighted keyword-based sentiment analysis
- **Update Frequency:** Real-time (on demand)
- **Time Window:** Last 7 days of articles
- **Backend:** Node.js/Express
- **Frontend:** React/TypeScript
- **Hosted on:** Render

## Questions or Feedback?

Methodology is transparent by design. If you have questions about how scores are calculated or notice inaccuracies, please:
1. Check the methodology page ("How It Works")
2. Review the raw news feeds to verify coverage
3. Compare with other news sources

## Transparency Commitment

- No hidden algorithms
- No proprietary "intelligence"
- No military/government affiliation
- Open methodology
- Real news sources
- Public data only

---

**Last Updated:** April 1, 2026
**Version:** 2.0 (Transparent Methodology)
