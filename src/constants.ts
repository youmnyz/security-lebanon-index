import { SecurityIndexData } from "./types";

export const INITIAL_SECURITY_DATA: SecurityIndexData = {
  overallScore: 50,
  isInitial: true,
  lastUpdated: new Date().toISOString(),
  categories: [
    {
      id: "political",
      title: "Political Stability",
      subHeading: "Government & Governance",
      score: 50,
      status: "Stable",
      description: "Monitoring political developments, government stability, and institutional integrity based on news analysis.",
      externalLink: "https://www.nna-leb.gov.lb",
      benchmarks: [],
      news: [
        {
          id: "p-n1",
          timestamp: new Date().toISOString(),
          title: "Political Developments in Lebanon",
          summary: "Tracking government statements, parliamentary activities, and political announcements from official sources.",
          severity: "Medium",
          source: "NNA",
          url: "https://news.google.com/search?q=Lebanon+Government+Stability+NNA&hl=en-LB&gl=LB&ceid=LB:en"
        }
      ]
    },
    {
      id: "economic",
      title: "Economic Conditions",
      subHeading: "Financial Markets & Currency",
      score: 50,
      status: "Stable",
      description: "Analysis of economic indicators, currency stability, and market conditions from financial reporting.",
      externalLink: "https://www.reuters.com/world/middle-east/",
      benchmarks: [],
      news: [
        {
          id: "e-n1",
          timestamp: new Date().toISOString(),
          title: "Lebanon Economic Updates",
          summary: "Monitoring currency exchange rates, banking system developments, and economic policy announcements.",
          severity: "Medium",
          source: "Reuters",
          url: "https://news.google.com/search?q=Lebanon+Economy+Reuters&hl=en-LB&gl=LB&ceid=LB:en"
        }
      ]
    },
    {
      id: "infrastructure",
      title: "Infrastructure & Services",
      subHeading: "Utilities & Public Systems",
      score: 50,
      status: "Stable",
      description: "Tracking reports on electricity, water, telecommunications, and other critical infrastructure.",
      externalLink: "https://www.naharnet.com/stories/en/lebanon",
      benchmarks: [],
      news: [
        {
          id: "i-n1",
          timestamp: new Date().toISOString(),
          title: "Infrastructure Status",
          summary: "Reports on power supply, water systems, telecommunications networks, and public utilities.",
          severity: "Medium",
          source: "Naharnet",
          url: "https://news.google.com/search?q=Lebanon+Infrastructure+Services+Naharnet&hl=en-LB&gl=LB&ceid=LB:en"
        }
      ]
    },
    {
      id: "humanitarian",
      title: "Humanitarian Concerns",
      subHeading: "Humanitarian & Social",
      score: 50,
      status: "Stable",
      description: "Monitoring humanitarian aid, displacement, healthcare, and social welfare indicators.",
      externalLink: "https://www.aljazeera.com/where/lebanon/",
      benchmarks: [],
      news: [
        {
          id: "h-n1",
          timestamp: new Date().toISOString(),
          title: "Humanitarian Situation",
          summary: "Tracking humanitarian organizations' reports, aid distribution, and social welfare developments.",
          severity: "Medium",
          source: "Al Jazeera",
          url: "https://news.google.com/search?q=Lebanon+Humanitarian+Aid+Al+Jazeera&hl=en-LB&gl=LB&ceid=LB:en"
        }
      ]
    },
    {
      id: "regional",
      title: "Regional Developments",
      subHeading: "Regional & International",
      score: 50,
      status: "Stable",
      description: "Coverage of regional geopolitical developments affecting Lebanon from international news sources.",
      externalLink: "https://www.lorientlejour.com/category/Liban",
      benchmarks: [],
      news: [
        {
          id: "r-n1",
          timestamp: new Date().toISOString(),
          title: "Regional News Impact",
          summary: "Monitoring regional developments, international diplomacy, and cross-border events affecting Lebanon.",
          severity: "Medium",
          source: "L'Orient-Le Jour",
          url: "https://news.google.com/search?q=Lebanon+Regional+Developments&hl=en-LB&gl=LB&ceid=LB:en"
        }
      ]
    }
  ],
  newsFeed: [
    {
      id: "n1",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      title: "Political Updates from Lebanon",
      summary: "Latest government statements and parliamentary activities. Monitoring political developments from official sources.",
      severity: "Medium",
      source: "NNA",
      url: "https://news.google.com/search?q=Lebanon+Political+Updates+NNA&hl=en-LB&gl=LB&ceid=LB:en",
      keywords: ["politics", "government", "statement"]
    },
    {
      id: "n2",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      title: "Economic Developments in Lebanon",
      summary: "Currency exchange rates and banking sector updates. Tracking economic indicators from financial news sources.",
      severity: "Medium",
      source: "Reuters",
      url: "https://news.google.com/search?q=Lebanon+Economic+Updates+Reuters&hl=en-LB&gl=LB&ceid=LB:en",
      keywords: ["economy", "currency", "market"]
    },
    {
      id: "n3",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      title: "Infrastructure Status Reports",
      summary: "Updates on electricity, water systems, and telecommunications. Monitoring critical infrastructure from local sources.",
      severity: "Low",
      source: "Naharnet",
      url: "https://news.google.com/search?q=Lebanon+Infrastructure+Updates+Naharnet&hl=en-LB&gl=LB&ceid=LB:en",
      keywords: ["infrastructure", "utilities", "services"]
    },
    {
      id: "n4",
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      title: "Humanitarian Situation Updates",
      summary: "NGO reports on humanitarian aid distribution and social welfare programs. Monitoring from international sources.",
      severity: "Medium",
      source: "Al Jazeera",
      url: "https://news.google.com/search?q=Lebanon+Humanitarian+News+Al+Jazeera&hl=en-LB&gl=LB&ceid=LB:en",
      keywords: ["humanitarian", "aid", "welfare"]
    }
  ],
  tacticalFeed: [
    {
      id: "w1",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      title: "Regional News Report",
      summary: "Coverage of regional developments affecting Lebanon. Monitoring international news from major outlets.",
      severity: "Medium",
      source: "L'Orient-Le Jour",
      url: "https://news.google.com/search?q=Lebanon+Regional+News&hl=en-LB&gl=LB&ceid=LB:en",
      keywords: ["regional", "international", "developments"]
    },
    {
      id: "w2",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      title: "Security News Summary",
      summary: "Aggregated security-related news from multiple sources. Daily summary of security-relevant reporting.",
      severity: "Low",
      source: "BBC",
      url: "https://news.google.com/search?q=Lebanon+Security+BBC&hl=en-LB&gl=LB&ceid=LB:en",
      keywords: ["security", "news", "summary"]
    }
  ],
  historicalData: [
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 48 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 49 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 50 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 49 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 50 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 49 },
    { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 50 }
  ]
};
