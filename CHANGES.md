# Lebanon News Index - Refactoring & Transparency Updates

## Summary of Changes

This refactoring transforms the application from a misleading "intelligence index" to a transparent, honest "news sentiment analysis tool."

---

## Major Changes

### 1. **Removed Misleading Intelligence Framing**

**Before:**
- "National Security Index"
- "Intelligence Findings"
- "Tactical Status Feed"
- "Kinetic Operations"
- "Intelligence Systems"
- "Confidential Report"

**After:**
- "News Sentiment Analysis"
- "News Analysis Summary"
- "Latest News"
- "News coverage analysis"
- "Transparent methodology"
- "Public news analysis"

### 2. **Replaced Hardcoded Product Categories with Real Reporting Categories**

**Before (Product-Aligned):**
- Fire Risks → Fire Solutions (zodfire.com)
- Lightning Risks → Lightning Protection (zodlightning.com)
- Criminal Risks → Intruder Protection (zodprotection.com)
- Financial Risks → Safes and Locks (zodsafe.com)
- Corporate News → Entrance Automation (zodentrance.com)

**After (News-Based):**
- Political Stability → Government & Governance
- Economic Conditions → Financial Markets & Currency
- Infrastructure & Services → Utilities & Public Systems
- Humanitarian Concerns → Aid & Social Welfare
- Regional Developments → Geopolitical Events

### 3. **Implemented Real Sentiment-Based Scoring**

**Before:** AI-generated scores with no methodology

**After:** Transparent keyword-based sentiment analysis
- Counts positive keywords in articles (stable, peace, progress, etc.)
- Counts negative keywords (attack, crisis, conflict, etc.)
- Weights by recency (newer articles count more)
- Weights by severity (High/Medium/Low)
- Converts to 0-100 score (50 = balanced)

### 4. **Added Transparency Throughout**

**New:**
- "How It Works" page with full methodology
- Transparency banner on every page
- Honest descriptions of what the tool does
- Methodology.md documentation
- Clear limitations section

**Updated:**
- Header changed from "Intelligence Feed" to "News-Based Security Analysis"
- Risk Assessment page renamed to "Daily News Analysis"
- Footer changed from "Intelligence verified" to "News Sentiment Analysis"

### 5. **Fixed Historical Data**

**Before:** Declining 24→45 creating false urgency narrative

**After:** Realistic neutral trend (48-50 range) reflecting balanced reporting

### 6. **Updated News Feed Content**

**Before:** Alarmist sample data (Emergency Airspace Closure, Mass Displacement)

**After:** Realistic sample data (Political Updates, Economic Developments, Infrastructure Status)

---

## Code Changes

### New Files

1. **src/lib/scoring.ts** - Transparent sentiment analysis functions
   - `analyzeSentiment()` - Analyzes text for positive/negative keywords
   - `calculateSecurityScore()` - Calculates weighted score from news items
   - `getStatusFromScore()` - Converts score to status badge
   - `getScoreExplanation()` - Provides transparent explanation

2. **src/components/Methodology.tsx** - Full transparency page
   - Explains scoring methodology
   - Lists data sources
   - Discusses limitations
   - Answers common questions

3. **METHODOLOGY.md** - Comprehensive documentation
   - Technical details
   - Keyword lists
   - Limitations discussion
   - Use case guidance

4. **CHANGES.md** - This file documenting all changes

### Modified Files

#### **server.ts**
- Added sentiment analysis functions
- Removed Gemini-based "AI generation" for scores
- Updated `/api/recalibrate` to use real scoring
- Updated `/api/ai-analysis` to analyze news sentiment
- Updated `/api/risk-assessment/:date` to provide news briefing
- Changed language from "intelligence" to "analysis"

#### **src/App.tsx**
- Added Methodology component import
- Added transparency banner to header
- Renamed "National Security Index" → "News Sentiment Analysis"
- Renamed "Intelligence Findings" → "News Analysis Summary"
- Renamed "Tactical Status Feed" → "Latest News"
- Updated descriptions to be honest about news analysis
- Changed all "intelligence" terminology to "news analysis"
- Added "How It Works" link to header
- Updated fallback AI analysis text to be honest
- Updated "Safety Lebanon" section to explain methodology

#### **src/constants.ts**
- Replaced 5 product-aligned categories with 5 news-based categories
- Updated sample news to be realistic instead of alarmist
- Changed historical data from declining (24→45) to neutral (50)
- Removed military/tactical language from descriptions

#### **src/pages/RiskAssessmentPage.tsx**
- Changed "Daily Security Briefing" → "News Sentiment Briefing"
- Changed "Risk Assessment" → "Daily News Analysis"
- Changed "Intelligence Report" → "Based on news coverage"
- Changed "Executive Summary" → "News Summary"
- Changed "Critical Risk Vectors" → "News Topics & Themes"
- Updated footer to reflect news analysis, not intelligence
- Added disclaimer about methodology

#### **src/main.tsx**
- Updated basename from `/lebanon-security-index` to `/security-index`

#### **README.md**
- Complete rewrite explaining the tool as news analysis
- Added disclaimer
- Listed actual data sources
- Explained how it works
- Highlighted limitations

### Removed/Deprecated

- Legacy Gemini-based score generation
- Hardcoded product category system
- Misleading "tactical," "kinetic," "intelligence" terminology
- Alarmist sample data narratives

---

## User-Facing Changes

### What Users Will See

1. **Home Page**
   - New transparency banner at top
   - Score explanation updated
   - "How It Works" button in header
   - Honest category descriptions
   - Real sample news items

2. **Methodology Page** (New)
   - Full explanation of scoring
   - List of data sources
   - Limitations discussion
   - Score interpretation guide

3. **Risk Assessment Page**
   - Changed to "Daily News Analysis"
   - More honest descriptions
   - Disclaimer in footer

4. **News Feeds**
   - More realistic sample data
   - Honest source attribution
   - Real news topics

---

## Methodology Overview

### Scoring Process (Simplified)

```
News Articles (from RSS feeds)
           ↓
    Sentiment Analysis
    (Count positive/negative keywords)
           ↓
    Apply Weights
    (Recency + Severity)
           ↓
    Calculate Average Sentiment
    (Range: -1 to +1)
           ↓
    Convert to Score
    (Range: 0 to 100)
           ↓
    Final Score
```

### Score Meaning

- **0-25:** Heavy negative reporting
- **25-50:** Mixed/warning reporting
- **50-75:** Stable/balanced reporting
- **75-100:** Positive reporting

Note: A score of 50 is normal and means coverage is balanced.

---

## Benefits of These Changes

✓ **Honesty:** No more false claims of "intelligence"
✓ **Transparency:** Full methodology disclosed
✓ **Accountability:** Clear limitations stated
✓ **Usability:** Clear guidance on what tool is for
✓ **Trust:** Users can understand and verify the process
✓ **Legality:** No misleading representations to regulators/users

---

## Testing Recommendations

1. **Verify Sentiment Analysis**
   - Test with known positive/negative articles
   - Verify keywords are counted correctly
   - Check weighting by recency

2. **Test UI Changes**
   - Confirm all misleading language removed
   - Verify Methodology page loads
   - Check transparency banner displays

3. **Test API Endpoints**
   - `/api/recalibrate` returns correct scores
   - `/api/ai-analysis` uses news data
   - `/api/live-news` fetches real feeds

4. **Verify News Feeds**
   - RSS feeds load correctly
   - Articles parse properly
   - Timestamps are accurate

---

## Deployment Notes

- No breaking changes to API structure
- All endpoints still functional
- Database schema unchanged
- Environment variables: GEMINI_API_KEY (still used for analysis summaries)

---

**Version:** 2.0 - Transparent Methodology
**Date:** April 1, 2026
**Status:** Ready for review
