import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import {
  AlertTriangle,
  Activity,
  Lock,
  Globe,
  Zap,
  ChevronRight,
  RefreshCw,
  History,
  Server,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import SEO from './components/SEO';
import Methodology from './components/Methodology';
import ArchivePage from './pages/ArchivePage';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { INITIAL_SECURITY_DATA } from './constants';
import { SecurityCategory, SecurityIndexData } from './types';
import { cn } from './lib/utils';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import DailyInfographic from './components/DailyInfographic';

const ALLOWED_SOURCES: Record<string, string> = {
  "NNA": "https://www.nna-leb.gov.lb/en/security-law",
  "L'Orient-Le Jour": "https://www.lorientlejour.com/category/Liban",
  "Naharnet": "https://www.naharnet.com/stories/en/lebanon",
  "Al Jazeera": "https://www.aljazeera.com/where/lebanon/",
  "Reuters": "https://www.reuters.com/world/middle-east/",
  "AFP": "https://www.reuters.com/world/middle-east/",
  "AP": "https://www.reuters.com/world/middle-east/",
  "LBCI": "https://www.lbcgroup.tv/news",
  "MTV Lebanon": "https://www.mtv.com.lb/en/news/Politics",
  "Al Jadeed": "https://www.aljadeed.tv/news",
};

// API Base URL - use localhost in dev, Render deployment in production
const getApiBaseUrl = () => {
  // Check if running on localhost/127.0.0.1 (development)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  // In production or preview, use the Render deployment
  return 'https://security-lebanon-index.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

const isQuotaError = (err: any) => {
  const errorBody = err?.error || err;
  return (
    errorBody?.code === 429 ||
    errorBody?.status === 'RESOURCE_EXHAUSTED' ||
    err?.message?.includes('429') ||
    err?.message?.includes('quota') ||
    err?.message?.includes('RESOURCE_EXHAUSTED')
  );
};

const safeFormatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "N/A";
  const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Secure':  return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Stable':  return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'Warning': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Critical':return 'text-red-600 bg-red-50 border-red-100';
    default:        return 'text-gray-600 bg-gray-50 border-gray-100';
  }
};

function resolveSourceUrl(source: string, title?: string, url?: string): string {
  // Always generate a Google News search for the specific article title + source
  // This surfaces the actual article as the top result without risking 404s
  if (title) {
    return `https://news.google.com/search?q=${encodeURIComponent(title + ' ' + source)}&hl=en-LB&gl=LB&ceid=LB:en`;
  }
  // No title: use verified source section URL if known
  const matchedKey = Object.keys(ALLOWED_SOURCES).find(s =>
    source?.toLowerCase().includes(s.toLowerCase())
  );
  if (matchedKey) return ALLOWED_SOURCES[matchedKey];
  // Unknown source with a URL: keep it if valid
  if (url && url.startsWith('http')) return url;
  return `https://news.google.com/search?q=${encodeURIComponent(source + ' Lebanon')}&hl=en-LB&gl=LB&ceid=LB:en`;
}

function sanitizeNewsItem(item: any) {
  delete item.imageUrl;
  delete item.keywords;
  const matchedKey = Object.keys(ALLOWED_SOURCES).find(s =>
    item.source?.toLowerCase().includes(s.toLowerCase())
  );
  if (matchedKey) item.source = matchedKey;
  item.url = resolveSourceUrl(item.source, item.title, item.url);
  return item;
}

function sanitizeCategoryNewsItem(item: any) {
  delete item.imageUrl;
  delete item.keywords;
  if (item.source) item.url = resolveSourceUrl(item.source, item.title, item.url);
  return item;
}

function repairJson(jsonStr: string) {
  let fixedText = jsonStr.trim();
  
  // Step 1: Handle unclosed strings and trailing escapes
  let inString = false;
  let escaped = false;
  for (let i = 0; i < fixedText.length; i++) {
    if (fixedText[i] === '"' && !escaped) {
      inString = !inString;
    }
    escaped = fixedText[i] === '\\' && !escaped;
  }
  
  if (inString) {
    if (escaped) {
      fixedText = fixedText.slice(0, -1);
    }
    fixedText += '"';
  }
  
  // Step 2: Remove trailing comma or colon that would make the JSON invalid after closing
  fixedText = fixedText.trim();
  while (fixedText.endsWith(',') || fixedText.endsWith(':')) {
    fixedText = fixedText.slice(0, -1).trim();
  }
  
  // Step 3: Close all open brackets/braces
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < fixedText.length; i++) {
    if (fixedText[i] === '"' && !esc) inStr = !inStr;
    if (!inStr) {
      if (fixedText[i] === '{') stack.push('}');
      else if (fixedText[i] === '[') stack.push(']');
      else if (fixedText[i] === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '}') stack.pop();
      }
      else if (fixedText[i] === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ']') stack.pop();
      }
    }
    esc = fixedText[i] === '\\' && !esc;
  }
  
  while (stack.length > 0) {
    fixedText += stack.pop();
  }
  return fixedText;
}

function Dashboard({ data, aiAnalysis, isAnalyzing, generateAiAnalysis, lebanonMap, mapStatus, liveNews }: {
  data: SecurityIndexData,
  aiAnalysis: any,
  isAnalyzing: boolean,
  generateAiAnalysis: () => void,
  lebanonMap: string | null,
  mapStatus: 'generating' | 'success' | 'fallback' | 'idle',
  liveNews: any[]
}) {
  const radarData = useMemo(() => (data.categories || []).map(cat => ({
    subject: cat.title.includes(' ') ? cat.title.split(' ')[0] : cat.title,
    A: cat.score || 0,
    fullMark: 100,
  })), [data.categories]);

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  // SEO: Optimized for "lebanon security" and "lebanon safety" keywords
  const seoTitle = aiAnalysis?.seoTitle || `Lebanon Security Index - Safety News & Analysis | ${data.overallScore}/100`;
  const seoDescription = aiAnalysis?.seoDescription || `Lebanon security and safety news tracker. Real-time analysis of Lebanon safety index covering criminal risks, fire safety, financial security, infrastructure threats, and business continuity. Current safety score: ${data.overallScore}/100`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Security Lebanon Index",
    "description": seoDescription,
    "url": window.location.href,
    "dateModified": data.lastUpdated,
    "creator": {
      "@type": "Organization",
      "name": "Intelligence Systems"
    },
    "variableMeasured": [
      {
        "@type": "PropertyValue",
        "name": "Overall Security Score",
        "value": data.overallScore,
        "maxValue": 100
      }
    ]
  };

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDescription}
        jsonLd={jsonLd}
      />
      <main className="max-w-7xl mx-auto p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
      {/* Row 1: Hero & AI Outlook - Modular & Autofill */}
      <div className="lg:col-span-8 flex flex-col">
        <section className="bg-[#2D2D2D] text-white border border-white/5 rounded-xl p-6 md:p-10 shadow-2xl flex flex-col lg:flex-row items-center gap-10 h-full relative overflow-hidden flex-1">
          {/* Tactical Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
          
          <div className="flex-1 text-center lg:text-left relative z-10">
            <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
              <div className="w-1.5 h-1.5 bg-[#E31E24] rounded-full animate-pulse" />
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#E31E24] font-bold">Lebanon Security & Safety Analysis</h2>
              {data.isInitial && (
                <span className="text-[8px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest border border-white/5">Initial Data</span>
              )}
            </div>

            <div className="flex items-end justify-center lg:justify-start gap-4 mb-6">
              <span className="text-8xl md:text-9xl font-black tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(227,30,36,0.2)]">{data.overallScore}</span>
              <div className="flex flex-col mb-3">
                <span className="text-2xl md:text-3xl font-bold opacity-20">/100</span>
                {data.historicalData && data.historicalData.length > 1 && (
                  <div className={cn(
                    "flex items-center text-[10px] font-bold uppercase tracking-widest mt-1",
                    data.overallScore > data.historicalData[data.historicalData.length - 2].score ? "text-red-500" : "text-emerald-500"
                  )}>
                    {data.overallScore > data.historicalData[data.historicalData.length - 2].score ? (
                      <><ArrowUpRight className="w-3 h-3 mr-1" /> More Negative</>
                    ) : (
                      <><TrendingDown className="w-3 h-3 mr-1" /> More Positive</>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm md:text-base text-white/70 leading-relaxed max-w-xl mb-8">
              <span className="text-white font-bold">Lebanon security & safety</span> news analysis from
              <span className="text-[#E31E24] font-bold"> 8+ international sources</span>.
              Real-time sentiment analysis of political stability, economic safety, infrastructure, humanitarian concerns, and regional developments.
            </p>
            
          </div>
          
          <div className="w-full max-w-[280px] aspect-square bg-black/40 rounded-2xl p-4 flex items-center justify-center shrink-0 border border-white/5 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E31E24]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#ffffff" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fontWeight: 700, fill: '#ffffff', opacity: 0.5 }} />
                <Radar name="Security Risk" dataKey="A" stroke="#E31E24" strokeWidth={2} fill="#E31E24" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#E31E24]/40 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#E31E24]/40 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#E31E24]/40 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#E31E24]/40 rounded-br-lg" />
          </div>
        </section>
      </div>

      {/* Row 4: Daily Security Feed (moved before intelligence findings) */}
      <div className="lg:col-span-8">
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg md:text-2xl font-black tracking-tighter uppercase text-[#2D2D2D] italic truncate">Daily Security Feed</h3>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-widest shrink-0">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E31E24] flex items-center gap-1 py-1">
                Real-Time Intelligence Feed
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl md:text-3xl font-black text-[#2D2D2D] tabular-nums">{liveNews.length}</div>
              <div className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border whitespace-nowrap border-emerald-200 text-emerald-600 bg-emerald-50 mt-1">
                Active
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
              {(liveNews.length > 0 ? liveNews : []).map((item, idx) => (
                <div key={item.url || idx} className="group border-b border-gray-50 last:border-0 pb-4 md:pb-6 last:pb-0">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 font-bold shrink-0">
                      {safeFormatDate(item.timestamp)}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-blue-200 text-blue-600 bg-blue-50 whitespace-nowrap">
                        Breaking
                      </span>
                      {item.source && (
                        <a
                          href={item.url || '#'}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-widest text-[#E31E24] hover:underline min-h-[44px] md:min-h-0 flex items-center"
                        >
                          {item.source}
                        </a>
                      )}
                    </div>
                  </div>
                  <h4 className="text-base md:text-lg font-extrabold tracking-tight mb-2 group-hover:text-[#E31E24] transition-colors">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.summary}</p>
                </div>
              ))}
              {liveNews.length === 0 && (
                <div className="text-center py-12 opacity-40 italic text-sm">
                  No breaking news at this moment. Check back shortly.
                </div>
              )}
            </div>
            {liveNews.length > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#E31E24] to-transparent opacity-30" />
            )}
          </div>
        </section>
      </div>

      {/* AI Findings - Modular & Predictable */}
      <div className="lg:col-span-4 flex flex-col">
        <section className="bg-white text-[#2D2D2D] p-6 rounded-xl shadow-xl border border-gray-200 relative overflow-hidden h-full flex flex-col flex-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap className="w-16 h-16 text-[#2D2D2D]" />
          </div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Activity className="w-4 h-4 text-[#E31E24]" />
            <h2 className="text-[9px] font-mono uppercase tracking-widest font-bold">News Analysis Summary</h2>
          </div>

          <div className="flex-1 overflow-hidden relative z-10">
            {isAnalyzing || !aiAnalysis ? (
              <div className="text-center py-8 opacity-60">
                <p className="text-sm font-medium">Analysis unavailable</p>
              </div>
            ) : (
              <div className="flex flex-col h-full gap-4">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  {aiAnalysis.summarySections ? (
                    aiAnalysis.summarySections.map((section: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        {section.title && (
                          <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#E31E24] mb-2 border-b border-gray-200 pb-1">
                            {section.title}
                          </h3>
                        )}
                        <div className="text-[11px] leading-relaxed opacity-80 font-medium markdown-body text-gray-700">
                          <Markdown>{section.content}</Markdown>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm leading-relaxed opacity-80 font-medium markdown-body text-gray-700">
                      <Markdown>{aiAnalysis.summary}</Markdown>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 shrink-0">
                  <ul className="space-y-2">
                    {(aiAnalysis.findings || []).slice(0, 3).map((finding: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-xs opacity-70 leading-tight">
                        <div className="w-1.5 h-1.5 bg-[#E31E24] rounded-full mt-1 shrink-0 shadow-[0_0_8px_#E31E24]" />
                        <span className="truncate">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Row 2: Daily Intelligence Infographic */}
      <div className="lg:col-span-12">
        <DailyInfographic data={data} aiAnalysis={aiAnalysis} mapImage={lebanonMap} mapStatus={mapStatus} />
      </div>

      {/* Row 3: Trend Analysis */}
      <div className="lg:col-span-12">
        <section className="bg-[#2D2D2D] text-white border border-white/5 rounded-xl p-4 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>

          <div className="flex justify-between items-center mb-4 md:mb-8 relative z-10">
            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E31E24] mb-1 font-bold">Trend Analysis</h2>
              <p className="text-base md:text-xl font-black uppercase tracking-tight text-white">7-Day Security Score Projection</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#E31E24] rounded-full shadow-[0_0_8px_#E31E24]" />
                <span>Security Score</span>
              </div>
            </div>
          </div>
          <div className="h-[200px] md:h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.historicalData || []}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E31E24" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#E31E24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#ffffff', opacity: 0.3 }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#ffffff', opacity: 0.3 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1A', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                  itemStyle={{ color: '#E31E24' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#E31E24" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 5: Category News Feeds */}
      <div className="lg:col-span-8 space-y-4 md:space-y-6">
        {(data.categories || []).map((category) => (
          <section key={category.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg md:text-2xl font-black tracking-tighter uppercase text-[#2D2D2D] italic truncate">{category.title}</h3>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-widest shrink-0">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </div>
                </div>
                <a
                  href={category.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold uppercase tracking-widest text-[#E31E24] hover:underline flex items-center gap-1 min-h-[44px] md:min-h-0 py-1"
                >
                  {category.subHeading} <ArrowUpRight className="w-3 h-3 shrink-0" />
                </a>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl md:text-3xl font-black text-[#2D2D2D] tabular-nums">{category.score}</div>
                <div className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded border mt-1 whitespace-nowrap", getStatusColor(category.status))}>
                  {category.status}
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
              {(category.news || []).map((item) => (
                <div key={item.id} className="group border-b border-gray-50 last:border-0 pb-4 md:pb-6 last:pb-0">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 font-bold shrink-0">
                      {safeFormatDate(item.timestamp)}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border whitespace-nowrap",
                        item.severity === 'High' ? "border-red-200 text-red-600 bg-red-50" :
                        item.severity === 'Medium' ? "border-amber-200 text-amber-600 bg-amber-50" :
                        "border-emerald-200 text-emerald-600 bg-emerald-50"
                      )}>
                        {item.severity}
                      </span>
                      {item.source && (
                        <a
                          href={item.url || '#'}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-widest text-[#E31E24] hover:underline min-h-[44px] md:min-h-0 flex items-center"
                        >
                          {item.source}
                        </a>
                      )}
                    </div>
                  </div>
                  <h4 className="text-base md:text-lg font-extrabold tracking-tight mb-2 group-hover:text-[#E31E24] transition-colors">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.summary}</p>
                </div>
              ))}
              {(!category.news || category.news.length === 0) && (
                <div className="text-center py-8 opacity-40 italic text-sm">
                  No active intelligence reports for this sector.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* SEO: Archive Link Section */}
      <div className="lg:col-span-12 bg-gradient-to-r from-[#2D2D2D] to-[#1a1a1a] border border-[#E31E24]/20 rounded-xl p-6 md:p-8 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Lebanon Security & Safety News Archive</h2>
            <p className="text-gray-100">
              Access 365 daily reports analyzing Lebanon security and safety news. Complete archive with real-time sentiment analysis, historical trends, and security assessments.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-white/10">
            <Link
              to="/archive"
              className="bg-[#E31E24] hover:bg-[#c71620] text-white px-4 py-2 rounded-lg font-bold text-sm transition text-center"
            >
              View All (365)
            </Link>
            {[
              { label: 'Last 7 Days', offset: 7 },
              { label: 'Last 30 Days', offset: 30 },
              { label: 'Last 90 Days', offset: 90 },
              { label: 'Last Year', offset: 365 }
            ].map(({ label, offset }) => (
              <Link
                key={label}
                to={`/risk-assessment/${new Date(new Date().setDate(new Date().getDate() - offset)).toISOString().split('T')[0]}`}
                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg font-semibold text-sm transition text-center border border-white/20 hover:border-[#E31E24]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 border-t border-gray-200 pt-6">
        {/* Historical Analysis */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#2D2D2D]" />
            <h2 className="text-[10px] font-mono uppercase tracking-widest font-bold">Historical Analysis</h2>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              return (
                <Link
                  key={i}
                  to={`/risk-assessment/${dateStr}`}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-[#E31E24] transition-all group shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#2D2D2D]">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-50">Daily Risk Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#E31E24] transition-colors" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* System Status & Safety Lebanon */}
        <div className="space-y-6">
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-[#2D2D2D]" />
              <h2 className="text-[10px] font-mono uppercase tracking-widest font-bold">System Status</h2>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Intelligence Nodes</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600">8/8 Active</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Data Latency</span>
                <span className="text-xs font-bold text-[#E31E24]">Real-time</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Signal Integrity</span>
                <span className="text-xs font-bold text-emerald-600">99.9%</span>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">All Systems Operational</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2D2D2D]" />
              <h2 className="text-[10px] font-mono uppercase tracking-widest font-bold">About This Index</h2>
            </div>
            <div className="bg-[#2D2D2D] text-white rounded-xl p-4 md:p-6 relative overflow-hidden shadow-xl">
              <div className="relative z-10">
                <h3 className="text-base font-bold mb-3">News-Based Security Analysis</h3>
                <p className="text-[11px] opacity-70 leading-relaxed">
                  This index analyzes sentiment from 8+ news sources to track coverage trends. Scores reflect reporting tone, not operational ground truth.
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-5">
                <Globe className="w-24 h-24" />
              </div>
            </div>
          </section>
        </div>

        {/* Methodology Reference */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#2D2D2D]" />
            <h2 className="text-[10px] font-mono uppercase tracking-widest font-bold">Data Sources</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[11px] text-blue-900 font-medium mb-1">8 International News Sources</p>
              <p className="text-[10px] text-blue-700">Real-time sentiment analysis from Naharnet, Al Jazeera, BBC, Reuters, and more.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[11px] text-amber-900 font-medium mb-1">30-Day Window</p>
              <p className="text-[10px] text-amber-700">Only news from the last 30 days included in score calculations.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-[11px] text-emerald-900 font-medium mb-1">Sentiment Analysis</p>
              <p className="text-[10px] text-emerald-700">Keyword-based sentiment scoring with severity weighting.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  );
}

const TacticalImage = ({ src, alt, id, type = 'tactical' }: { src?: string, alt: string, id: string, type?: 'tactical' | 'security' }) => {
  const [error, setError] = useState(false);
  
  // Use a more tactical fallback from Unsplash instead of loremflickr (which often returns cats)
  const fallbackSrc = type === 'tactical' 
    ? `https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop` 
    : `https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?q=80&w=800&auto=format&fit=crop`;

  return (
    <div className={cn(
      "relative aspect-video rounded-lg overflow-hidden border bg-black group/img",
      type === 'tactical' ? "border-white/10" : "border-gray-200 shadow-sm"
    )}>
      <img 
        src={error ? fallbackSrc : src} 
        alt={alt} 
        className={cn(
          "w-full h-full object-cover transition-all duration-700",
          type === 'tactical' ? "grayscale group-hover/img:grayscale-0 group-hover/img:scale-110" : "group-hover/img:scale-110 group-hover/img:brightness-110",
          error && "opacity-40"
        )}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
      />
      
      {/* Tactical HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#E31E24]/40" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#E31E24]/40" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#E31E24]/40" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#E31E24]/40" />
        
        {/* Scanning Line */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E31E24]/10 to-transparent h-1/4 w-full"
          animate={{ top: ['-20%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Metadata */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
          <div className="text-[6px] font-mono text-white/40 uppercase tracking-tighter">SEC-SCAN: {id.slice(0, 8)}</div>
          <div className="text-[6px] font-mono text-white/40 uppercase tracking-tighter">COORD: 33.89°N / 35.50°E</div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-sm border border-white/10">
          <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[6px] font-black uppercase tracking-widest text-white">Live Feed</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<SecurityIndexData>(INITIAL_SECURITY_DATA);
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [lebanonMap, setLebanonMap] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [mapStatus, setMapStatus] = useState<'generating' | 'success' | 'fallback' | 'idle'>('idle');
  const [hasAttemptedRecalibration, setHasAttemptedRecalibration] = useState(false);
  const location = useLocation();

  // Keep a ref to the latest data so callbacks don't go stale
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const fetchSecurityData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security-data`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch security data from API:", error);
    }
  }, []);

  const saveSecurityData = useCallback(async (newData: SecurityIndexData) => {
    try {
      await fetch(`${API_BASE_URL}/api/security-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    } catch (error) {
      console.error("Failed to save security data to API:", error);
    }
  }, []);

  const generateLebanonMap = useCallback(async () => {
    setMapStatus('generating');
    setLebanonMap("https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?q=80&w=1000&auto=format&fit=crop");
    setMapStatus('fallback');
  }, []);

  const recalibrateSystem = useCallback(async () => {
    setIsRecalibrating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recalibrate`);
      if (!response.ok) throw new Error('Server recalibration failed');
      const result = await response.json();

      if (result.newsFeed) result.newsFeed = result.newsFeed.map(sanitizeNewsItem);
      if (result.tacticalFeed) result.tacticalFeed = result.tacticalFeed.map(sanitizeNewsItem);
      if (result.categories) result.categories = result.categories.map((cat: any) => ({
        ...cat, news: (cat.news || []).map(sanitizeCategoryNewsItem)
      }));

      if (result.overallScore) {
        const newHistoricalEntry = {
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: result.overallScore
        };
        const current = dataRef.current;
        const updatedData = {
          ...current,
          ...result,
          historicalData: [...(current.historicalData || []), newHistoricalEntry].slice(-7)
        };
        setData(updatedData);
        await saveSecurityData(updatedData);
        generateAiAnalysis(updatedData);
      }
    } catch (error) {
      console.error("System recalibration failed:", error);
    } finally {
      setIsRecalibrating(false);
      setHasAttemptedRecalibration(true);
    }
  }, [saveSecurityData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _legacy_recalibrate = useCallback(async () => {
    try {
      const _response = await Promise.resolve({ model: "UNUSED",
        contents: `Perform a comprehensive tactical monitoring scan for the Lebanon Security Situation (2024-2026 period). 
        Provide a new SecurityIndexData object. 
        
        CRITICAL INSTRUCTIONS:
        1. 'isInitial' MUST be set to false.
        2. 'timestamp' MUST be a valid ISO 8601 string (e.g., "2026-03-26T12:00:00Z").
        3. 'title' and 'summary' MUST NOT contain metadata like "Source:", "Keywords:", or "Image:". Put that data ONLY in their respective fields.
        4. 'source' MUST be a real third-party news outlet (e.g., "Reuters", "Al Jazeera", "Naharnet", "L'Orient-Le Jour", "NNA"). 
        5. DO NOT use "Zod" or any variation of it as a news source. Zod is the platform, not the news source.
        5. 'url' MUST be a valid URL from this list only — DO NOT hallucinate article URLs:
           - NNA: "https://www.nna-leb.gov.lb/en/security-law"
           - L'Orient-Le Jour: "https://www.lorientlejour.com/category/Liban"
           - Naharnet: "http://www.naharnet.com/lebanon"
           - Al Jazeera: "https://www.aljazeera.com/tag/lebanon/"
           - Reuters: "https://www.reuters.com/world/middle-east/"
           - LBCI: "https://lbci.com/category/news/"
           - MTV Lebanon: "https://www.mtv.com.lb/En/News"
           - Al Jadeed: "https://www.aljadeed.tv/english/news"
        7. LIMIT: Max 2 news items per feed, max 2 tactical items per feed, max 2 news items per category. Keep summaries under 200 characters.
        8. Use exactly these 5 categories with their specific subHeadings and externalLinks:
           - 'Fire Risks': subHeading="Fire Solutions", externalLink="https://zodfire.com"
           - 'Lightning Risks': subHeading="Lightning Protection", externalLink="https://zodlightning.com"
           - 'Criminal Risks': subHeading="Intruder Protection", externalLink="https://zodprotection.com"
           - 'Financial Risks': subHeading="Safes and Locks Solutions", externalLink="https://zodsafe.com"
           - 'Corporate News': subHeading="Entrance Automation Solutions", externalLink="https://zodentrance.com"
        9. Populate the 'news' array for each category with relevant intelligence.
        10. Ensure all security indexes are updated based on the latest regional developments.
        
        Format: Return a JSON object matching the requested schema.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          responseSchema: {
            type: "OBJECT",
            properties: {
              overallScore: { type: "NUMBER" },
              isInitial: { type: "BOOLEAN" },
              lastUpdated: { type: "STRING" },
              categories: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    title: { type: "STRING" },
                    score: { type: "NUMBER" },
                    status: { type: "STRING" },
                    description: { type: "STRING" },
                    subHeading: { type: "STRING" },
                    externalLink: { type: "STRING" },
                    news: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          id: { type: "STRING" },
                          timestamp: { type: "STRING" },
                          title: { type: "STRING" },
                          summary: { type: "STRING" },
                          severity: { type: "STRING" },
                          source: { type: "STRING" },
                          url: { type: "STRING" }
                        }
                      }
                    }
                  }
                }
              },
              newsFeed: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    timestamp: { type: "STRING", description: "ISO 8601 format" },
                    title: { type: "STRING" },
                    summary: { type: "STRING" },
                    severity: { type: "STRING" },
                    source: { type: "STRING" },
                    url: { type: "STRING" }
                  }
                }
              },
              tacticalFeed: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    timestamp: { type: "STRING", description: "ISO 8601 format" },
                    title: { type: "STRING" },
                    summary: { type: "STRING" },
                    severity: { type: "STRING" },
                    source: { type: "STRING" },
                    url: { type: "STRING" }
                  }
                }
              }
            }
          }
        }
      });

      const text = (_response as any).text || "{}";
      let result;

      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error during recalibration. Attempting to fix truncated JSON.", e);
        const fixedText = repairJson(text);
        try {
          result = JSON.parse(fixedText);
        } catch (innerE) {
          console.error("Failed to parse AI response even after robust fix attempt. Fixed text snippet:", fixedText.slice(-50));
          throw new Error("Failed to parse AI response even after fix attempt.");
        }
      }

      if (result.newsFeed) result.newsFeed = result.newsFeed.map(sanitizeNewsItem);
      if (result.tacticalFeed) result.tacticalFeed = result.tacticalFeed.map(sanitizeNewsItem);
      if (result.categories) result.categories = result.categories.map((cat: any) => ({
        ...cat, news: (cat.news || []).map(sanitizeCategoryNewsItem)
      }));

      if (result.overallScore) {
        const newHistoricalEntry = {
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: result.overallScore
        };
        
        const current = dataRef.current;
        const updatedData = {
          ...current,
          ...result,
          historicalData: [...(current.historicalData || []), newHistoricalEntry].slice(-7)
        };

        setData(updatedData);
        await saveSecurityData(updatedData);
        generateAiAnalysis(updatedData);
      }
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn("Gemini Quota Exhausted during recalibration. Using cached data.");
      } else {
        console.error("System recalibration failed:", error);
      }
    } finally {
      setIsRecalibrating(false);
      setHasAttemptedRecalibration(true);
    }
  }, [saveSecurityData]);

  const generateAiAnalysis = useCallback(async (currentData?: SecurityIndexData) => {
    const resolved = currentData ?? dataRef.current;
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: resolved.overallScore, lastUpdated: resolved.lastUpdated })
      });
      if (!response.ok) throw new Error('Server AI analysis failed');
      const result = await response.json();
      setAiAnalysis(result);
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn("Gemini Quota Exhausted during AI analysis. Using fallback text.");
      } else {
        console.error("AI Analysis failed:", error);
      }
      setAiAnalysis({
        summarySections: [
          { title: "Analysis Unavailable", content: "Unable to generate analysis summary at this time. Please try refreshing the page or clicking Update to fetch fresh data." },
          { title: "Recommendation", content: "Review the raw news feeds below for current reporting. Use the Methodology page to understand how scores are calculated." }
        ],
        findings: ["Refresh to get latest data", "Review news sources directly", "Check back in a few moments"],
        metrics: { Resilience: 50, Stability: 50, Risk: 50 }
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // On mount: load persisted data
  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // On mount: fetch live news from RSS feeds
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/live-news`)
      .then(r => r.json())
      .then(setLiveNews)
      .catch(console.error);
  }, []);

  // Trigger recalibration when data is stale or still at initial score
  useEffect(() => {
    if (hasAttemptedRecalibration || isRecalibrating) return;
    const isStale = new Date(data.lastUpdated).toDateString() !== new Date().toDateString();
    if (isStale || data.overallScore === 24) {
      recalibrateSystem();
      generateLebanonMap();
    }
  }, [data.lastUpdated, data.overallScore, hasAttemptedRecalibration, isRecalibrating, recalibrateSystem, generateLebanonMap]);

  // Generate AI analysis once recalibration is done (or data is already fresh)
  useEffect(() => {
    if (location.pathname !== '/' || aiAnalysis || isAnalyzing || isRecalibrating) return;
    if (hasAttemptedRecalibration || new Date(data.lastUpdated).toDateString() === new Date().toDateString()) {
      generateAiAnalysis();
    }
  }, [location.pathname, hasAttemptedRecalibration, isRecalibrating, aiAnalysis, isAnalyzing, generateAiAnalysis]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#1A1A1A] font-sans selection:bg-[#2D2D2D] selection:text-white">
      {/* Transparency Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 md:px-8 py-3">
        <p className="text-xs md:text-sm text-blue-900 text-center">
          <strong>Transparency Notice:</strong> This index analyzes news sentiment. Scores reflect media coverage, not definitive security assessments.
        </p>
      </div>

      {/* ZOD Disclaimer Banner */}
      <div className="bg-red-50 border-b border-red-200 px-4 md:px-8 py-3">
        <p className="text-xs md:text-sm text-red-900 text-center">
          <strong>Disclaimer:</strong> ZOD is not responsible for the accuracy, completeness, or use of information displayed on this tool. Users access this service entirely at their own risk.
        </p>
      </div>

      {/* Header */}
      <header className="bg-[#2D2D2D] text-white px-4 md:px-8 py-4 flex justify-between items-center shadow-md">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-md">
            <Lock className="text-[#2D2D2D] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-tight leading-none">Lebanon News Index</h1>
            <p className="text-[9px] font-mono opacity-70 uppercase tracking-widest mt-1">News-Based Security Analysis</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider opacity-70">
            {isRecalibrating ? (
              <div className="flex items-center gap-2 text-[#E31E24] animate-pulse">
                <Globe className="w-3 h-3 animate-spin" />
                <span>Updating feeds...</span>
              </div>
            ) : (
              <span>Last Update: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
            )}
          </div>
          {location.pathname === '/' && (
            <button
              onClick={() => recalibrateSystem()}
              disabled={isAnalyzing || isRecalibrating}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              title="Fetch latest news and recalculate scores"
            >
              <RefreshCw className={cn("w-4 h-4", (isAnalyzing || isRecalibrating) && "animate-spin")} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Update</span>
            </button>
          )}
          <Link
            to="/methodology"
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            How It Works
          </Link>
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <Dashboard
            data={data}
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            generateAiAnalysis={generateAiAnalysis}
            lebanonMap={lebanonMap}
            mapStatus={mapStatus}
            liveNews={liveNews}
          />
        } />
        <Route path="/risk-assessment/:date" element={<RiskAssessmentPage />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/page/:page" element={<ArchivePage />} />
      </Routes>
    </div>
  );
}
