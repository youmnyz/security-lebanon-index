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
  newsFeed: [],
  tacticalFeed: [],
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
