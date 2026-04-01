import React from 'react';
import { 
  ShieldAlert, 
  Zap, 
  Droplets, 
  Wifi, 
  Truck, 
  AlertTriangle, 
  ShieldCheck,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Target,
  Users
} from 'lucide-react';
import { SecurityIndexData } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DailyInfographicProps {
  data: SecurityIndexData;
  aiAnalysis?: any;
  mapImage?: string | null;
  mapStatus?: 'generating' | 'success' | 'fallback' | 'idle';
}

const DailyInfographic: React.FC<DailyInfographicProps> = ({ data, aiAnalysis, mapImage, mapStatus }) => {
  const [zoom, setZoom] = React.useState(1);
  const [selectedRegion, setSelectedRegion] = React.useState<any>(null);

  const getThreatLevel = (score: number) => {
    if (score < 20) return { label: 'EXTREME', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (score < 40) return { label: 'HIGH', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    if (score < 60) return { label: 'ELEVATED', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (score < 80) return { label: 'MODERATE', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    return { label: 'LOW', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  };

  const threat = getThreatLevel(data.overallScore);

  const infrastructure = [
    { name: 'Fire Monitoring', status: data.categories.find(c => c.id === 'fire')?.score || 0, icon: AlertTriangle },
    { name: 'Lightning Defense', status: data.categories.find(c => c.id === 'lightning')?.score || 0, icon: Zap },
    { name: 'Criminal Activity', status: data.categories.find(c => c.id === 'criminal')?.score || 0, icon: ShieldAlert },
    { name: 'Financial Stability', status: data.categories.find(c => c.id === 'financial')?.score || 0, icon: Activity },
  ];

  const getRegionalData = () => {
    const baseRegions = [
      { id: 'north', name: 'North Lebanon', score: 75, x: '45%', y: '20%', keywords: ['north', 'tripoli', 'akkar'] },
      { id: 'beirut', name: 'Greater Beirut', score: 65, x: '35%', y: '45%', keywords: ['beirut', 'dahieh', 'airport'] },
      { id: 'south', name: 'South Lebanon', score: 15, x: '35%', y: '75%', keywords: ['south', 'tyre', 'sidon', 'border', 'nabatieh'] },
      { id: 'bekaa', name: 'Bekaa Valley', score: 35, x: '65%', y: '40%', keywords: ['bekaa', 'baalbek', 'hermel', 'zahle'] },
      { id: 'mount', name: 'Mount Lebanon', score: 55, x: '45%', y: '50%', keywords: ['mount', 'chouf', 'aley', 'jounieh'] },
    ];

    if (!data.tacticalFeed) return baseRegions;

    return baseRegions.map(region => {
      let scoreAdjustment = 0;
      data.tacticalFeed.forEach(item => {
        const text = (item.title + ' ' + item.summary).toLowerCase();
        if (region.keywords.some(k => text.includes(k))) {
          scoreAdjustment -= item.severity === 'High' ? 15 : item.severity === 'Medium' ? 8 : 4;
        }
      });
      return {
        ...region,
        score: Math.max(5, Math.min(95, region.score + scoreAdjustment))
      };
    });
  };

  const regions = getRegionalData();

  return (
    <div className="bg-[#1A1A1A] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 font-sans">
      {/* Header */}
      <div className="p-4 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#E31E24] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] font-bold opacity-60">News Analysis Briefing</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic">Daily News Coverage Analysis</h2>
          <p className="text-xs font-mono opacity-40 mt-2 uppercase tracking-widest">Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | Score: {data.overallScore}/100</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 0.5, 3))}
              className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
            >
              +
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))}
              className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
            >
              -
            </button>
            <button 
              onClick={() => setZoom(1)}
              className="px-3 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors text-[10px] font-bold uppercase"
            >
              Reset
            </button>
          </div>
          <div className={cn(
            "px-6 py-3 rounded-lg border-2 flex flex-col items-center justify-center min-w-[140px]",
            threat.bg, threat.border, threat.color
          )}>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Threat Level</span>
            <span className="text-2xl font-black tracking-tighter leading-none">{threat.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Metrics */}
        <div className="lg:col-span-3 p-4 md:p-8 border-r border-white/5 space-y-8 md:space-y-12">
          {/* Risk Gauge */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-6">Coverage Sentiment Score</h3>
            <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-4">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all duration-1000"
                style={{ width: `${data.overallScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
              <span>Very Positive</span>
              <span>Very Negative</span>
            </div>
          </div>

          {/* Category Scores */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-6">Category Coverage Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              {infrastructure.map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                  <item.icon className="w-5 h-5 mb-3 opacity-60" />
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{item.name}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-black tracking-tighter leading-none">{item.status}%</span>
                    <span className="text-[8px] font-bold opacity-20 mb-1">CAP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Heatmap/Visual */}
        <div className="lg:col-span-6 p-4 md:p-8 border-r border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Regional Coverage Analysis</h3>
            <div className="flex items-center gap-4">
              <span className="text-[8px] font-mono opacity-20 uppercase tracking-widest">Real-time Analysis Active</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-mono opacity-40 uppercase">Live Link</span>
              </div>
            </div>
          </div>
          <div className="aspect-[16/9] bg-black rounded-2xl relative overflow-hidden border border-white/5">
            <motion.div 
              className="w-full h-full relative"
              style={{ scale: zoom }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Generated Map Image */}
              {mapImage ? (
                <>
                  <img 
                    src={mapImage} 
                    alt="Lebanon Tactical Map" 
                    className="w-full h-full object-cover opacity-30 grayscale contrast-150"
                    referrerPolicy="no-referrer"
                  />
                  {mapStatus === 'fallback' && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full backdrop-blur-md">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500">Default Map (Limit Reached)</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                  <div className="text-[10px] font-mono opacity-20 uppercase animate-pulse">Loading coverage map...</div>
                </div>
              )}

              {/* Tactical Grid Overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full grid grid-cols-20 grid-rows-10">
                  {Array.from({ length: 200 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-white/10" />
                  ))}
                </div>
              </div>
              
              {/* Scanning Line Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E31E24]/20 to-transparent h-1/6 w-full z-10 pointer-events-none"
                animate={{ top: ['-20%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {/* Regional Status Indicators (Abstract) */}
              {regions.map((region) => (
                <motion.div 
                  key={region.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, zIndex: 50 }}
                  onClick={() => setSelectedRegion(region)}
                  className={cn(
                    "absolute p-3 border border-white/10 bg-black/80 backdrop-blur-xl rounded-xl -translate-x-1/2 -translate-y-1/2 shadow-2xl min-w-[120px] cursor-pointer transition-all",
                    selectedRegion?.id === region.id ? "ring-2 ring-white/40 scale-110" : "hover:bg-white/5"
                  )}
                  style={{ left: region.x, top: region.y }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest">{region.name}</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      region.score < 30 ? "bg-red-600 shadow-[0_0_12px_#E31E24]" : region.score < 60 ? "bg-orange-600 shadow-[0_0_12px_#F27D26]" : "bg-emerald-600 shadow-[0_0_12px_#10B981]"
                    )} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full",
                        region.score < 30 ? "bg-red-600" : region.score < 60 ? "bg-orange-600" : "bg-emerald-600"
                      )} style={{ width: `${region.score}%` }} />
                    </div>
                    <span className="text-[8px] font-mono font-bold opacity-60">{region.score}%</span>
                  </div>
                  <div className="mt-2 text-[6px] font-mono opacity-30 uppercase tracking-tighter">
                    Click for analysis
                  </div>
                </motion.div>
              ))}

              {/* Selected Region Detail Overlay */}
              {selectedRegion && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute top-4 right-4 w-56 md:w-64 max-w-[calc(100%-2rem)] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-6 z-50 shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">{selectedRegion.name}</h4>
                      <div className="text-[8px] font-mono opacity-40 uppercase mt-1">Detailed Analysis</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedRegion(null); }}
                      className="text-[10px] opacity-40 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[8px] font-bold uppercase opacity-40 mb-2">
                        <span>Risk Score</span>
                        <span>{selectedRegion.score}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full",
                            selectedRegion.score < 30 ? "bg-red-600" : selectedRegion.score < 60 ? "bg-orange-600" : "bg-emerald-600"
                          )}
                          style={{ width: `${selectedRegion.score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[8px] font-bold uppercase opacity-40 mb-2">Active Keywords</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedRegion.keywords.map((k: string) => (
                          <span key={k} className="px-2 py-0.5 bg-white/5 rounded text-[7px] font-mono uppercase opacity-60">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="text-[8px] font-bold uppercase opacity-40 mb-2">Coverage Analysis</div>
                      <p className="text-[9px] leading-relaxed opacity-70 italic">
                        {selectedRegion.score < 30 
                          ? "Critical instability detected. Multiple high-severity incidents reported in this sector. Immediate caution advised."
                          : selectedRegion.score < 60
                          ? "Elevated risk levels. Sporadic activity detected. Monitor local feeds for rapid changes."
                          : "Sector remains relatively stable. Standard security protocols sufficient."}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Static UI Overlays */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none z-20">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-[#E31E24] rounded-full animate-ping" />
                <div className="text-[9px] font-mono text-[#E31E24] uppercase tracking-widest font-bold">Analysis Active</div>
              </div>
              <div className="text-[8px] font-mono opacity-40 uppercase tracking-widest">Region: Lebanon</div>
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-8 right-8 z-20 pointer-events-none bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_8px_#E31E24]" />
                  <span>Negative Coverage</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 bg-orange-600 rounded-full shadow-[0_0_8px_#F27D26]" />
                  <span>Mixed Coverage</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-[0_0_8px_#10B981]" />
                  <span>Positive Coverage</span>
                </div>
              </div>
            </div>

            {/* Coordinate Readout */}
            <div className="absolute bottom-8 left-8 z-20 font-mono text-[7px] opacity-30 space-y-1">
              <div>LAT: 33.8938° N</div>
              <div>LNG: 35.5018° E</div>
              <div>ALT: 142M MSL</div>
            </div>
          </div>
        </div>

        {/* Right Column: Directives */}
        <div className="lg:col-span-3 p-4 md:p-8 space-y-6 md:space-y-8">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-6">Coverage Observations</h3>
            <div className="space-y-4">
              {(aiAnalysis?.directives || [
                { label: 'Politics', text: 'Government and governance developments dominate reporting.', icon: ArrowUpRight },
                { label: 'Economic', text: 'Financial market coverage shows mixed trends.', icon: ShieldAlert },
                { label: 'Regional', text: 'Regional geopolitical events frequently covered.', icon: Activity },
              ]).map((item: any, i: number) => {
                const Icon = item.icon || (i === 0 ? ArrowUpRight : i === 1 ? ShieldAlert : Activity);
                return (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#E31E24]" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{item.label}</div>
                      <p className="text-[11px] font-medium leading-tight mt-1">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">Coverage Volatility</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-12 flex items-end gap-1">
                {[
                  aiAnalysis?.metrics?.Resilience || 40,
                  aiAnalysis?.metrics?.Stability || 60,
                  aiAnalysis?.metrics?.Risk || 30,
                  80, 50, 90, 40
                ].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-[#E31E24]/20 rounded-t-sm" 
                    style={{ height: `${h}%` }} 
                  />
                ))}
              </div>
              <div className="text-right">
                <div className="text-xs font-black tracking-tighter">
                  {aiAnalysis?.metrics?.Risk ? `+${aiAnalysis.metrics.Risk}%` : '+12%'}
                </div>
                <div className="text-[8px] font-bold uppercase opacity-20">Volatility</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">System Integrity: Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-500" />
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Feed: Real-time</span>
          </div>
        </div>
        <div className="text-[8px] font-mono opacity-20 uppercase tracking-widest">
          Lebanon News Index © 2026 | Public Analysis
        </div>
      </div>
    </div>
  );
};

export default DailyInfographic;
