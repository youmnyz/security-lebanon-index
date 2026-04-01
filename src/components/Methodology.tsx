import React from 'react';
import { AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

export default function Methodology() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Transparency Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">About This Index</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              This security index is an analytical tool based on news sentiment analysis. It reflects
              the frequency and tone of security-related reporting, not ground-truth security assessments.
              Scores should be interpreted as indicators of media coverage intensity, not definitive measures
              of actual safety conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Scoring Methodology */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Scoring Methodology</h2>

        <div className="grid gap-4">
          {/* Data Sources */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-[#2D2D2D]">Data Sources</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-[#E31E24] font-bold">•</span>
                <span><strong>RSS Feeds:</strong> Real-time feeds from 8+ news organizations (NNA, Reuters, Al Jazeera, Naharnet, BBC, etc.)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E31E24] font-bold">•</span>
                <span><strong>Time Window:</strong> Last 7 days of news coverage</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E31E24] font-bold">•</span>
                <span><strong>Update Frequency:</strong> Real-time as new articles are published</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E31E24] font-bold">•</span>
                <span><strong>Language:</strong> English-language sources and translations</span>
              </li>
            </ul>
          </div>

          {/* Calculation Method */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-lg text-[#2D2D2D]">How Scores Are Calculated</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">1.</span>
                <span><strong>Sentiment Analysis:</strong> Each article is analyzed for keywords indicating positive, neutral, or negative sentiment (e.g., "attack", "stable", "crisis", "progress")</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">2.</span>
                <span><strong>Weighting:</strong> Articles are weighted by recency (newer articles count more) and severity tags (High/Medium/Low severity incidents weighted differently)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">3.</span>
                <span><strong>Aggregation:</strong> Weighted sentiments are averaged to produce a score from -1 (very negative reporting) to +1 (very positive reporting)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">4.</span>
                <span><strong>Conversion:</strong> Sentiment score is converted to a 0-100 scale: -1 sentiment = 0 (dangerous), 0 sentiment = 50 (neutral), +1 sentiment = 100 (safe)</span>
              </li>
            </ol>
          </div>

          {/* Score Interpretation */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-lg text-[#2D2D2D] mb-4">Score Interpretation</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded">
                <div className="w-3 h-3 bg-red-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-red-900">0-25: Critical</div>
                  <div className="text-xs text-red-700">Heavy negative reporting with urgent language</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded">
                <div className="w-3 h-3 bg-amber-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-amber-900">25-50: Warning</div>
                  <div className="text-xs text-amber-700">Mixed reporting with some concerning developments</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-blue-900">50-75: Stable</div>
                  <div className="text-xs text-blue-700">Generally balanced reporting with some improvements</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded">
                <div className="w-3 h-3 bg-emerald-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-emerald-900">75-100: Secure</div>
                  <div className="text-xs text-emerald-700">Predominantly positive reporting with constructive tone</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Important Limitations</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-3 text-sm text-yellow-900">
          <p>
            <strong>Media Bias:</strong> This index reflects news coverage, which may not represent actual conditions.
            Underreported areas will have artificially high scores.
          </p>
          <p>
            <strong>Language Limitation:</strong> Only English-language sources are included. Arabic and French reporting may have different perspectives.
          </p>
          <p>
            <strong>Delayed Intelligence:</strong> News reporting lags behind actual events. Scores represent historical coverage, not real-time conditions.
          </p>
          <p>
            <strong>Not Operational Intelligence:</strong> This is not a military, police, or intelligence agency assessment. It is a public-facing analytical tool.
          </p>
          <p>
            <strong>Categories:</strong> The five reporting categories represent major topic areas in the news, not operational security domains.
          </p>
        </div>
      </section>

      {/* Data Freshness */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Data Freshness & Updates</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 text-sm text-gray-700">
          <p>
            <strong>Update Frequency:</strong> The index recalibrates every time you load the page or click "Recalibrate"
            by fetching the latest RSS feeds and reanalyzing sentiment.
          </p>
          <p>
            <strong>Historical Data:</strong> 7-day historical trend shows how sentiment has changed over the past week.
          </p>
          <p>
            <strong>No Caching of Scores:</strong> Scores are recalculated on-demand from fresh feed data, ensuring current information.
          </p>
        </div>
      </section>

      {/* Contact & Feedback */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-lg text-[#2D2D2D] mb-4">Questions About This Index?</h3>
        <p className="text-sm text-gray-700">
          This index is provided for informational purposes. Methodology improvements and feedback are welcome.
          For questions about accuracy or methodology, please refer to the source news feeds directly.
        </p>
      </section>
    </div>
  );
}
