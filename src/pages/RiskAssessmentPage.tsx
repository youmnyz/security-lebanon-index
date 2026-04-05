import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ChevronRight, 
  Calendar, 
  Download, 
  Share2,
  Zap,
  Activity,
  FileText,
  Lock
} from 'lucide-react';
import SEO from '../components/SEO';
import { RiskAssessment } from '../types';
import { cn } from '../lib/utils';

// Get API base URL - use localhost in dev, current domain in production
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  // In production, use the current domain (works for custom domains and Render URL)
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}`;
  }
  return 'https://security-lebanon-index.onrender.com';
};

const API_BASE = getApiBaseUrl();

export default function RiskAssessmentPage() {
  const { date } = useParams<{ date: string }>();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/risk-assessment/${date}`);
      if (!response.ok) throw new Error('Server error');
      const result = await response.json();
      setAssessment(result);
    } catch (err) {
      console.error("Failed to generate assessment:", err);
      setError("Intelligence feed interrupted. Please verify your connection to the security index systems.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAssessment();
  }, [date]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative">
          <Activity className="w-16 h-16 text-[#E31E24] animate-pulse" />
          <div className="absolute inset-0 border-4 border-[#E31E24] rounded-full animate-ping opacity-20" />
        </div>
        <h2 className="mt-8 text-xl font-bold uppercase tracking-widest text-[#2D2D2D]">Intelligence Sync</h2>
        <p className="mt-2 text-sm text-gray-400 font-mono">Decrypting regional security vectors for {date}...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-[#E31E24] mb-6" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#2D2D2D]">System Alert</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{error || "Critical data retrieval error."}</p>
        <button 
          onClick={generateAssessment}
          className="mt-8 bg-[#E31E24] text-white px-8 py-3 rounded-md font-bold uppercase tracking-widest text-xs hover:bg-opacity-90 transition-all"
        >
          Retry Sync
        </button>
      </div>
    );
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-emerald-500';
      case 'Moderate': return 'bg-blue-500';
      case 'Elevated': return 'bg-amber-500';
      case 'High': return 'bg-orange-500';
      case 'Extreme': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const seoTitle = assessment.seoTitle || `Daily Security Briefing: ${assessment.threatLevel} Risk - ${date}`;
  const seoDescription = assessment.seoDescription || assessment.summary;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": seoTitle,
    "description": seoDescription,
    "datePublished": date,
    "dateModified": date,
    "inLanguage": "en",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${typeof window !== 'undefined' ? window.location.href : ''}`
    },
    "author": {
      "@type": "Organization",
      "name": "Intelligence Systems",
      "url": "https://zodsecurity.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZodSecurity",
      "logo": {
        "@type": "ImageObject",
        "url": "https://zodsecurity.com/logo.png"
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        jsonLd={jsonLd}
        ogType="article"
      />
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#2D2D2D] hover:text-[#E31E24] transition-colors mb-8">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#2D2D2D] text-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Lock className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#E31E24] rounded-full" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold opacity-70">News Sentiment Briefing</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Daily News Analysis</h1>
                <p className="text-lg opacity-60 mt-2 font-medium">Based on news coverage for {new Date(date!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2 font-bold">Threat Level</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black uppercase tracking-tight">{assessment.threatLevel}</span>
                  <div className={cn("w-4 h-4 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.3)]", getThreatColor(assessment.threatLevel))} />
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-[#E31E24]">News Summary</h3>
              <p className="text-base md:text-lg leading-relaxed opacity-90 font-medium italic">
                "{assessment.summary}"
              </p>
              <p className="text-xs opacity-50 mt-3">Based on news sentiment analysis from multiple sources</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12">
          {/* Key Topics */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-6 h-6 text-[#E31E24]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-[#2D2D2D]">News Topics & Themes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(assessment.keyRisks || []).map((risk, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 p-6 rounded-xl hover:border-[#2D2D2D]/20 transition-all group">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#E31E24] mb-2">{risk.category}</h4>
                  <h3 className="text-lg font-bold text-[#2D2D2D] mb-3 leading-tight">{risk.description}</h3>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Mitigation Strategy</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 24h Outlook */}
          <section className="bg-[#E31E24]/5 border border-[#E31E24]/10 p-8 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="w-24 h-24 text-[#E31E24]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-[#E31E24]" />
                <h2 className="text-xl font-black uppercase tracking-tight text-[#2D2D2D]">24-Hour Outlook</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                {assessment.outlook24h || (assessment as any).outlook}
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-100">
            <button className="flex-1 md:flex-none bg-[#E31E24] text-white px-8 py-4 rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-red-900/20">
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button className="flex-1 md:flex-none border-2 border-[#E31E24] text-[#E31E24] px-8 py-4 rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#E31E24] hover:text-white transition-all">
              <Share2 className="w-4 h-4" /> Share Briefing
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 text-center space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
            News Sentiment Analysis • Based on public news sources • © 2026 Lebanon News Index
          </p>
          <p className="text-[9px] text-gray-500">
            This analysis reflects news coverage patterns, not operational intelligence assessments.
          </p>
        </div>
      </div>
    </div>
  );
}
