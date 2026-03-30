import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// URLs we own/know — skip validation to save time
const VERIFIED_URLS = new Set([
  "https://www.nna-leb.gov.lb/en/security-law",
  "https://www.lorientlejour.com/category/Liban",
  "https://www.naharnet.com/stories/en/lebanon",
  "https://www.aljazeera.com/where/lebanon/",
  "https://www.reuters.com/world/middle-east/",
  "https://www.lbcgroup.tv/news",
  "https://www.mtv.com.lb/en/news/Politics",
  "https://www.aljadeed.tv/news",
]);

async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;
  if (VERIFIED_URLS.has(url)) return true;
  // Google News search URLs are always valid
  if (url.startsWith("https://news.google.com/search")) return true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function filterValidNews<T extends { url?: string }>(items: T[]): Promise<T[]> {
  const results = await Promise.all(
    items.map(async (item) => ({
      item,
      valid: await isUrlReachable(item.url || ""),
    }))
  );
  return results.filter((r) => r.valid).map((r) => r.item);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // In-memory data store (simulating a database)
  let securityData = {
    overallScore: 24,
    isInitial: true,
    lastUpdated: new Date().toISOString(),
    categories: [
      {
        id: "fire",
        title: "Fire Risks",
        subHeading: "Fire Solutions",
        score: 15,
        status: "Warning",
        description: "Real-time fire monitoring and forest fire risk assessments across Lebanon.",
        externalLink: "https://zodfire.com",
        benchmarks: [],
        news: [
          {
            id: "f-n1",
            timestamp: new Date().toISOString(),
            title: "Wildfire Alert: Chouf Mountains",
            summary: "High risk of forest fires detected in the Chouf region due to dry conditions. Local civil defense on standby.",
            severity: "High",
            source: "National News Agency",
            url: "https://www.nna-leb.gov.lb/en/security-law"
          }
        ]
      },
      {
        id: "lightning",
        title: "Lightning Risks",
        subHeading: "Lightning Protection",
        score: 30,
        status: "Stable",
        description: "Weather forecast and lightning strike probability monitoring.",
        externalLink: "https://zodlightning.com",
        benchmarks: [],
        news: [
          {
            id: "l-n1",
            timestamp: new Date().toISOString(),
            title: "Storm Warning: Northern Coastal Areas",
            summary: "Lightning strike probability increased for the next 6 hours in Tripoli and surrounding areas.",
            severity: "Medium",
            source: "L'Orient-Le Jour",
            url: "https://www.lorientlejour.com/category/Liban"
          }
        ]
      },
      {
        id: "criminal",
        title: "Criminal Risks",
        subHeading: "Intruder Protection",
        score: 45,
        status: "Warning",
        description: "Monitoring theft, burglary, and general criminal activity trends.",
        externalLink: "https://zodprotection.com",
        benchmarks: [],
        news: [
          {
            id: "c-n1",
            timestamp: new Date().toISOString(),
            title: "Theft Trend: Urban Residential Areas",
            summary: "Increased reports of nighttime burglaries in Beirut's outer districts. Enhanced security measures recommended.",
            severity: "Medium",
            source: "Naharnet",
            url: "https://www.naharnet.com/stories/en/lebanon"
          }
        ]
      },
      {
        id: "financial",
        title: "Financial Risks",
        subHeading: "Safes and Locks Solutions",
        score: 10,
        status: "Critical",
        description: "Economic stability and financial security monitoring.",
        externalLink: "https://zodsafe.com",
        benchmarks: [],
        news: [
          {
            id: "fn-n1",
            timestamp: new Date().toISOString(),
            title: "Currency Volatility Update",
            summary: "Significant fluctuations in the unofficial exchange rate reported. Financial safety protocols advised.",
            severity: "High",
            source: "Reuters",
            url: "https://www.reuters.com/world/middle-east/"
          }
        ]
      },
      {
        id: "corporate",
        title: "Corporate News",
        subHeading: "Entrance Automation Solutions",
        score: 60,
        status: "Stable",
        description: "Business continuity and corporate security developments.",
        externalLink: "https://zodentrance.com",
        benchmarks: [],
        news: [
          {
            id: "co-n1",
            timestamp: new Date().toISOString(),
            title: "Corporate Access Protocols Updated",
            summary: "New digital entrance security standards implemented for major business hubs in Beirut.",
            severity: "Low",
            source: "Al Jazeera",
            url: "https://www.aljazeera.com/where/lebanon/"
          }
        ]
      }
    ],
    newsFeed: [
      {
        id: "n1",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        title: "Security Lebanon: Emergency Airspace Closure Confirmed",
        summary: "Civil Aviation Authority suspends all commercial operations at BEY following increased regional military activity. Emergency evacuation flights prioritized.",
        severity: "High",
        source: "L'Orient-Le Jour",
        url: "https://www.lorientlejour.com/category/Liban",
        keywords: ["airport", "beirut", "military"]
      }
    ],
    tacticalFeed: [
      {
        id: "w1",
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        title: "Frontline Report: Southern Border Activity",
        summary: "Intense military exchanges reported in the border villages. Local sources confirm multiple strikes on tactical positions.",
        severity: "High",
        source: "Al Jazeera",
        url: "https://www.aljazeera.com/where/lebanon/",
        keywords: ["border", "soldier", "explosion"]
      }
    ],
    historicalData: [
      { date: "Mar 20", score: 45 },
      { date: "Mar 21", score: 42 },
      { date: "Mar 22", score: 38 },
      { date: "Mar 23", score: 31 },
      { date: "Mar 24", score: 28 },
      { date: "Mar 25", score: 26 },
      { date: "Mar 26", score: 24 }
    ]
  };

  app.use(express.json({ limit: '1mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/security-data", (req, res) => {
    res.json(securityData);
  });

  app.post("/api/security-data", async (req, res) => {
    try {
      const body = req.body;

      // Validate URLs in all news arrays, filter out broken ones
      const [newsFeed, tacticalFeed, categories] = await Promise.all([
        body.newsFeed ? filterValidNews(body.newsFeed) : Promise.resolve(securityData.newsFeed),
        body.tacticalFeed ? filterValidNews(body.tacticalFeed) : Promise.resolve(securityData.tacticalFeed),
        body.categories
          ? Promise.all(
              body.categories.map(async (cat: any) => ({
                ...cat,
                news: cat.news ? await filterValidNews(cat.news) : [],
              }))
            )
          : Promise.resolve(securityData.categories),
      ]);

      securityData = {
        ...securityData,
        ...body,
        newsFeed,
        tacticalFeed,
        categories,
        lastUpdated: new Date().toISOString(),
      };
      res.json({ status: "success", data: securityData });
    } catch (err) {
      console.error("Failed to validate and save security data:", err);
      res.status(500).json({ status: "error" });
    }
  });

  // Sitemap generation
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://security-lebanon.run.app";
    const today = new Date().toISOString().split('T')[0];
    
    // Generate a list of the last 30 days for historical indexing
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${last30Days.map(date => `
  <url>
    <loc>${baseUrl}/risk-assessment/${date}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.5</priority>
  </url>`).join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = process.env.APP_URL || "https://security-lebanon.run.app";
    res.type("text/plain");
    res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
