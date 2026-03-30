export interface SecurityCategory {
  id: string;
  title: string;
  subHeading: string;
  score: number;
  status: 'Critical' | 'Warning' | 'Stable' | 'Secure';
  description: string;
  benchmarks: Benchmark[];
  news: NewsItem[];
  externalLink?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  compliant: boolean;
  details: string;
}

export interface NewsItem {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  severity: 'Low' | 'Medium' | 'High';
  source: string;
  url?: string;
  imageUrl?: string;
  keywords?: string[];
}

export interface RiskAssessment {
  date: string;
  summary: string;
  threatLevel: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Extreme';
  keyRisks: {
    category: string;
    description: string;
    mitigation: string;
  }[];
  outlook24h: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SecurityIndexData {
  overallScore: number;
  isInitial?: boolean;
  lastUpdated: string;
  categories: SecurityCategory[];
  newsFeed: NewsItem[];
  tacticalFeed: NewsItem[];
  historicalData: { date: string; score: number }[];
}
