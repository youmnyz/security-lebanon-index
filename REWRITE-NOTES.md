# Complete Rewrite: Static HTML Generation Architecture

## What Changed

**Old Architecture (React SPA):**
- Vite build system
- React frontend with dynamic API calls
- Client-side rendering
- Slow initial load (loads JS, then calls API, then renders)
- Complex SPA routing

**New Architecture (Static HTML):**
- Pure Node.js/Express server
- Server-side HTML generation at 7 AM daily
- Static HTML files served directly
- Lightning-fast loads (just serve pre-built HTML)
- Simple file-based routing

## How It Works

### Daily Generation (7 AM Beirut Time)

```
RSS Feeds (8 sources)
    ↓
Fetch Latest News
    ↓
Groq API Analysis
    ↓
Generate Assessment JSON
    ↓
Generate Static HTML File
    ↓
Save to /public/risk-assessment/YYYY-MM-DD.html
```

### User Visits Page

```
User: https://zodsecurity.com/lebanon-security-index/risk-assessment/2026-04-15
    ↓
Express Server
    ↓
Load pre-generated HTML file
    ↓
Serve instantly (⚡ no API calls, no rendering)
```

## Files

**New:**
- `server-static.js` - Complete new server implementation
- This file handles everything:
  - RSS feed fetching
  - Groq API analysis
  - Daily cron job (7 AM)
  - Static HTML generation
  - File serving

**Removed (no longer needed):**
- `vite.config.ts`
- `src/` directory (React components)
- `package.json` build scripts

**Modified:**
- `package.json` - Updated scripts to use server-static.js only

## Running It

```bash
# Development
npm run dev

# Production (on Render)
npm start
```

## Environment Variables

Required in `.env` or Render environment:
- `GROQ_API_KEY` - API key for Groq (llama-3.3-70b model)
- `PORT` - Server port (default: 3000)

## Deployment on Render

1. Update `start` command to: `node --import tsx/esm server-static.js`
2. Set `GROQ_API_KEY` environment variable
3. Server runs on configured PORT
4. Daily generation happens automatically at 7 AM Beirut time

## Why It's Fast

- **No JavaScript compilation** - HTML is ready
- **No API calls at load time** - HTML is pre-generated
- **No React overhead** - Just plain HTML/CSS
- **Static file serving** - Instant delivery
- **Pre-computed content** - Generated once at 7 AM

## Data Generation

At 7 AM Beirut time daily:
1. Fetches from 8 RSS sources:
   - National News Agency (NNA)
   - Naharnet
   - The961
   - The New Arab
   - Middle East Eye
   - BBC Middle East
   - Al Jazeera
   - Google News

2. Analyzes news using Groq's llama-3.3-70b model
3. Calculates security score from threat keywords
4. Generates threat level (Low, Moderate, Elevated, High, Extreme)
5. Creates HTML with schema.org markup for SEO
6. Saves for permanent serving

## URL Structure

- Homepage: `/lebanon-security-index/`
- Archive: Lists all generated assessments with dates
- Daily Report: `/lebanon-security-index/risk-assessment/YYYY-MM-DD`
- Example: `/lebanon-security-index/risk-assessment/2026-04-15`

## Testing

Locally:
```bash
npm run dev
# Visit: http://localhost:3000/lebanon-security-index/
```

## Notes

- Pages are generated ONCE at 7 AM - not regenerated
- Old pages are never updated (historical record)
- If Groq API fails, no assessment is generated for that day
- Archives show all days with assessments available
- Missing day links show "Not Available" message

## Next: DNS & Routing

Once deployed on Render:
1. Update reverse proxy on Bluehost .htaccess
2. Route `/lebanon-security-index/` to Render service
3. User sees: `zodsecurity.com/lebanon-security-index/`
4. Server responds: Pre-generated static HTML ⚡
