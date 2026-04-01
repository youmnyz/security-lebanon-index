import { SecurityIndexData } from "./types";

export const INITIAL_SECURITY_DATA: SecurityIndexData = {
  overallScore: 50,
  isInitial: true,
  lastUpdated: new Date().toISOString(),
  categories: [
    {
      id: "fire",
      title: "Fire Risks",
      subHeading: "Fire Solutions",
      score: 50,
      status: "Stable",
      description: "Real-time fire monitoring and safety assessments.",
      externalLink: "https://zodfire.com",
      benchmarks: [],
      news: []
    },
    {
      id: "lightning",
      title: "Lightning Risks",
      subHeading: "Lightning Protection",
      score: 50,
      status: "Stable",
      description: "Weather and lightning strike probability monitoring.",
      externalLink: "https://zodlightning.com",
      benchmarks: [],
      news: []
    },
    {
      id: "criminal",
      title: "Criminal Risks",
      subHeading: "Intruder Protection",
      score: 50,
      status: "Stable",
      description: "Monitoring criminal activity and security threats.",
      externalLink: "https://zodprotection.com",
      benchmarks: [],
      news: []
    },
    {
      id: "financial",
      title: "Financial Risks",
      subHeading: "Safes and Locks Solutions",
      score: 50,
      status: "Stable",
      description: "Economic stability and financial security monitoring.",
      externalLink: "https://zodsafe.com",
      benchmarks: [],
      news: []
    },
    {
      id: "corporate",
      title: "Corporate News",
      subHeading: "Entrance Automation Solutions",
      score: 50,
      status: "Stable",
      description: "Business continuity and corporate security developments.",
      externalLink: "https://zodentrance.com",
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
