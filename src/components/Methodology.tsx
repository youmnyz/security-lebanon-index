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
              This security index is an analytical tool that assesses security risks for Lebanon based on available information,
              news reports, and regional developments. Threat levels reflect analyzed risk factors including political stability,
              economic security, infrastructure concerns, and humanitarian issues. This is a risk assessment tool, not an
              intelligence agency report. Assessments should inform awareness and planning, not replace professional security consultation.
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
                <span><strong>Time Window:</strong> Recent news items and 30-day historical data for trend analysis</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E31E24] font-bold">•</span>
                <span><strong>AI Analysis:</strong> Groq LLM analyzes incidents to generate substantive risk assessments</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E31E24] font-bold">•</span>
                <span><strong>Update Frequency:</strong> Real-time as new articles are published and analyzed</span>
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
              <h3 className="font-bold text-lg text-[#2D2D2D]">How Risk Assessment Works</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">1.</span>
                <span><strong>News Collection:</strong> Fetches recent news from 8+ RSS feeds covering political developments, economic indicators, infrastructure status, criminal activity, and humanitarian issues</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">2.</span>
                <span><strong>Threat Scoring:</strong> Keyword analysis identifies threat indicators (conflicts, crises, attacks, casualties) and calculates an overall security score (0-100)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">3.</span>
                <span><strong>AI Analysis:</strong> Groq LLM analyzes recent incidents and generates comprehensive assessments across five security domains: Politics, Economic, Infrastructure, Criminal Activity, and Humanitarian</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#E31E24] shrink-0">4.</span>
                <span><strong>Risk Metrics:</strong> Calculates Resilience, Stability, and Risk metrics (0-100) and identifies specific sub-threats with mitigation strategies for each domain</span>
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
                  <div className="text-xs text-red-700">Severe security threats across multiple domains with urgent response required</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded">
                <div className="w-3 h-3 bg-amber-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-amber-900">25-50: Warning</div>
                  <div className="text-xs text-amber-700">Significant security vulnerabilities with manageable risks and some concerning incidents</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-blue-900">50-75: Stable</div>
                  <div className="text-xs text-blue-700">Moderate security concerns with resilient infrastructure and improving conditions</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded">
                <div className="w-3 h-3 bg-emerald-600 rounded-full" />
                <div className="flex-1">
                  <div className="font-bold text-emerald-900">75-100: Secure</div>
                  <div className="text-xs text-emerald-700">Low security risks with strong resilience and stable security conditions</div>
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
            <strong>Data Limitations:</strong> This index is based on publicly available information and news sources. Events not covered by these sources may not be reflected in the assessment.
          </p>
          <p>
            <strong>Language Coverage:</strong> Analysis focuses on English-language sources. Security developments reported only in Arabic or French may not be captured.
          </p>
          <p>
            <strong>Time Lag:</strong> There is a delay between actual security incidents and their reporting. Scores reflect analyzed available information, not real-time conditions.
          </p>
          <p>
            <strong>Not Official Intelligence:</strong> This is not an assessment from military, police, or intelligence agencies. It is a public analytical tool based on available information.
          </p>
          <p>
            <strong>Risk Categories:</strong> The five categories (Politics, Economic, Infrastructure, Criminal, Humanitarian) represent major security domains, not news topics.
          </p>
        </div>
      </section>

      {/* Data Freshness */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#2D2D2D]">Data Freshness & Updates</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 text-sm text-gray-700">
          <p>
            <strong>Update Frequency:</strong> The index recalibrates every time you load the page or click "Update"
            by fetching the latest news sources and reassessing security risks.
          </p>
          <p>
            <strong>Historical Data:</strong> 7-day historical trend shows how the security score has evolved, reflecting changes in threat landscape.
          </p>
          <p>
            <strong>Response Caching:</strong> Successful AI analysis results are cached to ensure consistent, meaningful assessments even during temporary API interruptions. Fallback template text is never shown to users when real data is available.
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
