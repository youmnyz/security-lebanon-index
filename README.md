# Lebanon News Index - Transparent News Analysis

A real-time news sentiment analysis tool tracking coverage of Lebanon from 8+ international news sources.

**Note:** This is a **news analysis tool**, not an intelligence assessment. It measures how positive/negative reporting is, not actual conditions.

## What Is This?

This tool analyzes news coverage from multiple sources to calculate "sentiment scores" - showing whether reporting about Lebanon is trending more positive or negative. It's useful for understanding **media coverage patterns**, not for making operational decisions.

## Live Feeds

The index pulls real-time news from:

- National News Agency (NNA)
- Naharnet
- Reuters
- Al Jazeera
- The961
- BBC
- New Arab
- Google News

All feeds are fetched on-demand and analyzed using transparent sentiment analysis.

## How It Works

1. **Fetches** the latest news articles from RSS feeds
2. **Analyzes sentiment** using keyword matching (positive vs. negative language)
3. **Weighs by recency** (newer articles count more)
4. **Converts to score** (0-100, where 50 = balanced coverage)
5. **Tracks trends** over the past 7 days

For full methodology details, see [METHODOLOGY.md](METHODOLOGY.md) or visit the "How It Works" page in the app.

## Key Features

✓ **Real-time news feeds** - Live RSS feeds from 8+ sources
✓ **Sentiment analysis** - Transparent, keyword-based scoring
✓ **Historical trends** - 7-day tracking of coverage sentiment
✓ **Category breakdown** - Political, economic, humanitarian, infrastructure, regional
✓ **Full transparency** - No hidden algorithms, methodology disclosed

## Important Limitations

- Reflects **news coverage patterns**, not actual ground truth
- Only includes **English-language sources**
- Has **reporting lag** (yesterday's news, not real-time conditions)
- Is **not operational intelligence** (don't use for critical decisions)
- Can miss **context in sentiment analysis**

## Run Locally

**Prerequisites:** Node.js 16+

```bash
# Install dependencies
npm install

# Set your Gemini API key (for analysis summaries)
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Run dev server
npm run dev

# Open http://localhost:5173
```

## Development

```bash
# Build
npm run build

# Deploy to production (configured for Render)
# Set GEMINI_API_KEY environment variable on deployment platform
```

## Transparency

- **No proprietary intelligence** - Uses public news sources
- **Open methodology** - All scoring explained
- **No hidden algorithms** - Keyword-based sentiment, nothing more
- **Real data sources** - RSS feeds from actual news organizations
- **Free to use** - No commercial intent

## Disclaimer

This tool does NOT provide:
- Military intelligence
- Police/law enforcement analysis
- Government security assessments
- Investment advice
- Actionable threat intelligence

It IS a public tool for understanding **news coverage trends**.

## Questions?

- See the **"How It Works"** page in the app
- Read [METHODOLOGY.md](METHODOLOGY.md)
- Review the raw news feeds directly

---

**Version:** 2.0 - Transparent Methodology
**Last Updated:** April 1, 2026
