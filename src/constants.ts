import { SecurityIndexData } from "./types";

export const INITIAL_SECURITY_DATA: SecurityIndexData = {
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
          url: "https://news.google.com/search?q=Wildfire+Alert+Chouf+Mountains+National+News+Agency&hl=en-LB&gl=LB&ceid=LB:en"
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
          url: "https://news.google.com/search?q=Storm+Warning+Northern+Coastal+Areas+Lebanon&hl=en-LB&gl=LB&ceid=LB:en"
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
          url: "https://news.google.com/search?q=Theft+Trend+Urban+Residential+Beirut+Lebanon&hl=en-LB&gl=LB&ceid=LB:en"
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
          url: "https://news.google.com/search?q=Lebanon+Currency+Volatility+Reuters&hl=en-LB&gl=LB&ceid=LB:en"
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
          url: "https://news.google.com/search?q=Corporate+Access+Protocols+Beirut+Lebanon&hl=en-LB&gl=LB&ceid=LB:en"
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
      url: "https://news.google.com/search?q=Security+Lebanon+Emergency+Airspace+Closure+Confirmed&hl=en-LB&gl=LB&ceid=LB:en",
      imageUrl: "https://images.unsplash.com/photo-1520437358207-323b43b50729?q=80&w=1000&auto=format&fit=crop",
      keywords: ["airport", "aviation", "security"]
    },
    {
      id: "n2",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      title: "Safety Lebanon: Critical Infrastructure Alert in South",
      summary: "Major telecommunications hub in Sidon reported offline following targeted strikes. Repair teams unable to deploy due to ongoing hostilities.",
      severity: "High",
      source: "Naharnet",
      url: "https://news.google.com/search?q=Safety+Lebanon+Critical+Infrastructure+Alert+South+Naharnet&hl=en-LB&gl=LB&ceid=LB:en",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
      keywords: ["infrastructure", "telecom", "damage"]
    },
    {
      id: "n3",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      title: "Security Lebanon: Cyber Attack on Ministry of Health",
      summary: "Coordinated ransomware attack targeting hospital coordination systems. Emergency protocols activated to maintain patient data integrity.",
      severity: "Medium",
      source: "Reuters",
      url: "https://news.google.com/search?q=Lebanon+Cyber+Attack+Ministry+Health+Reuters&hl=en-LB&gl=LB&ceid=LB:en",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
      keywords: ["cyber", "health", "attack"]
    },
    {
      id: "n4",
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      title: "Safety Lebanon: Mass Displacement in Bekaa Region",
      summary: "Over 50,000 civilians displaced in the last 24 hours. Humanitarian corridors being established under high-risk conditions.",
      severity: "High",
      source: "Al Jazeera",
      url: "https://news.google.com/search?q=Lebanon+Mass+Displacement+Bekaa+Al+Jazeera&hl=en-LB&gl=LB&ceid=LB:en",
      imageUrl: "https://images.unsplash.com/photo-1469571483333-243c8401537a?q=80&w=1000&auto=format&fit=crop",
      keywords: ["displacement", "humanitarian", "bekaa"]
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
      url: "https://news.google.com/search?q=Frontline+Report+Southern+Border+Lebanon+Al+Jazeera&hl=en-LB&gl=LB&ceid=LB:en",
      imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000&auto=format&fit=crop",
      keywords: ["border", "military", "combat"]
    },
    {
      id: "w2",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      title: "Airspace Alert: Reconnaissance Overflights",
      summary: "Continuous drone activity detected over Beirut and Mount Lebanon. Civil defense on high alert.",
      severity: "Medium",
      source: "L'Orient-Le Jour",
      url: "https://news.google.com/search?q=Airspace+Alert+Reconnaissance+Overflights+Lebanon+L%27Orient-Le+Jour&hl=en-LB&gl=LB&ceid=LB:en",
      imageUrl: "https://images.unsplash.com/photo-1506947411487-a56738267384?q=80&w=1000&auto=format&fit=crop",
      keywords: ["drone", "airspace", "surveillance"]
    }
  ],
  historicalData: [
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 45 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 42 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 38 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 31 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 28 },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 26 },
    { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 24 }
  ]
};
