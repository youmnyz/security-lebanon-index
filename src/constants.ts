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
      description: "Monitoring government stability, political developments, and governance in Lebanon.",
      externalLink: "https://zodsecurity.com",
      benchmarks: [],
      news: []
    },
    {
      id: "economic",
      title: "Economic Security",
      subHeading: "Currency & Markets",
      score: 50,
      status: "Stable",
      description: "Tracking currency stability, banking sector, and economic developments in Lebanon.",
      externalLink: "https://zodsecurity.com",
      benchmarks: [],
      news: []
    },
    {
      id: "infrastructure",
      title: "Infrastructure",
      subHeading: "Utilities & Services",
      score: 50,
      status: "Stable",
      description: "Monitoring electricity, water, telecommunications, and critical infrastructure in Lebanon.",
      externalLink: "https://zodsecurity.com",
      benchmarks: [],
      news: []
    },
    {
      id: "humanitarian",
      title: "Humanitarian",
      subHeading: "Aid & Welfare",
      score: 50,
      status: "Stable",
      description: "Tracking humanitarian situation, aid distribution, and social welfare programs in Lebanon.",
      externalLink: "https://zodsecurity.com",
      benchmarks: [],
      news: []
    },
    {
      id: "regional",
      title: "Regional Security",
      subHeading: "Border & Diplomacy",
      score: 50,
      status: "Stable",
      description: "Monitoring regional conflicts, border security, and international relations affecting Lebanon.",
      externalLink: "https://zodsecurity.com",
      benchmarks: [],
      news: []
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
