import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2D2D2D] text-white mt-16 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#E31E24]">Lebanon Security Index</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Real-time news sentiment analysis tracking Lebanon security and safety from 8+ international sources.
              This tool measures media coverage patterns, not operational intelligence.
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-[#E31E24] bg-opacity-10 border border-[#E31E24] border-opacity-30 rounded-lg p-6">
            <h3 className="font-bold text-[#E31E24] mb-3 flex items-center gap-2">
              For Comprehensive Security Solutions
              <ExternalLink className="w-4 h-4" />
            </h3>
            <p className="text-sm text-gray-200 mb-4">
              For all your Lebanon security and safety needs, visit ZOD Security.
            </p>
            <a
              href="https://zodsecurity.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#E31E24] hover:bg-[#c01a1a] text-white px-4 py-2 rounded font-semibold transition text-sm"
            >
              Visit zodsecurity.com
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <div>
              <p>
                © 2026 <a href="https://zodsecurity.com" className="text-[#E31E24] hover:underline">ZOD Security</a>. Lebanon Security Index - News Analysis Tool.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-gray-800 bg-opacity-50 rounded border border-gray-700 text-xs text-gray-400">
            <strong>Disclaimer:</strong> This is a news analysis tool measuring media coverage sentiment, not operational intelligence or security assessment.
            ZOD is not responsible for the accuracy or completeness of information displayed. Users access this service entirely at their own risk.
            For professional security consulting, visit <a href="https://zodsecurity.com" className="text-[#E31E24] hover:underline">zodsecurity.com</a>.
          </div>
        </div>
      </div>
    </footer>
  );
}
