import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import SEO from '../components/SEO';

export default function ArchivePage() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  const itemsPerPage = 30;

  // Generate 365 days of dates for SEO
  const allDates = useMemo(() => {
    return Array.from({ length: 365 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const totalPages = Math.ceil(allDates.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageDates = allDates.slice(startIdx, startIdx + itemsPerPage);

  const seoTitle = `Lebanon Security & Safety News Archive | ${allDates.length} Reports | zodsecurity.com`;
  const seoDescription = `Complete archive of Lebanon security and safety risk assessments. ${allDates.length} daily reports with detailed threat analysis, political stability evaluation, economic security trends, and regional development tracking.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Lebanon Security News Archive',
    description: seoDescription,
    url: `https://zodsecurity.com/security-index/archive${currentPage > 1 ? `/page/${currentPage}` : ''}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: pageDates.map((date, idx) => ({
        '@type': 'ListItem',
        position: startIdx + idx + 1,
        item: {
          '@type': 'NewsArticle',
          headline: `Lebanon Security Report - ${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
          datePublished: date,
          url: `https://zodsecurity.com/security-index/risk-assessment/${date}`
        }
      }))
    }
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        jsonLd={jsonLd}
        ogType="website"
        keywords="lebanon security archive, daily reports, risk assessment, security analysis, historical data, security trends"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-[#E31E24]" />
              <h1 className="text-4xl font-bold text-[#2D2D2D]">
                Lebanon Security & Safety News Archive
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl">
              Complete archive of {allDates.length} daily Lebanon security and safety risk assessments.
              Comprehensive security threat evaluation covering political stability, economic security, infrastructure resilience, humanitarian concerns, and regional developments affecting Lebanon.
            </p>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {pageDates.map((date) => {
              const dateObj = new Date(date);
              const dayNum = allDates.indexOf(date) + 1;

              return (
                <Link
                  key={date}
                  to={`/risk-assessment/${date}`}
                  className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-[#E31E24] transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#2D2D2D] group-hover:text-[#E31E24] transition">
                        {dateObj.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </h3>
                      <p className="text-sm text-gray-500">Day {dayNum} of {allDates.length}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Lebanon security and safety risk assessment report
                  </p>

                  <div className="flex items-center text-[#E31E24] font-semibold text-sm group-hover:gap-2 transition-all">
                    View Report <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2">
            {currentPage > 1 && (
              <Link
                to={currentPage === 2 ? '/archive' : `/archive/page/${currentPage - 1}`}
                className="flex items-center gap-2 px-4 py-2 rounded border border-gray-200 hover:bg-gray-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Link>
            )}

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Link
                    key={pageNum}
                    to={pageNum === 1 ? '/archive' : `/archive/page/${pageNum}`}
                    className={`px-4 py-2 rounded border transition ${
                      currentPage === pageNum
                        ? 'bg-[#E31E24] text-white border-[#E31E24]'
                        : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 py-2">...</span>
                  <Link
                    to={`/archive/page/${totalPages}`}
                    className={`px-4 py-2 rounded border transition ${
                      currentPage === totalPages
                        ? 'bg-[#E31E24] text-white border-[#E31E24]'
                        : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {totalPages}
                  </Link>
                </>
              )}
            </div>

            {currentPage < totalPages && (
              <Link
                to={`/archive/page/${currentPage + 1}`}
                className="flex items-center gap-2 px-4 py-2 rounded border border-gray-200 hover:bg-gray-100 transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* SEO-Friendly Info Box */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-3">About Lebanon Security Analysis</h2>
            <p className="text-blue-800 mb-3">
              This archive contains {allDates.length} daily reports analyzing Lebanon security and safety news coverage
              from 8+ international news sources. Each report provides real-time security risk assessment across five key categories:
            </p>
            <ul className="space-y-2 text-blue-800">
              <li>• <strong>Lebanon Political Security</strong> - Government stability and governance developments</li>
              <li>• <strong>Lebanon Economic Safety</strong> - Financial market conditions and economic security</li>
              <li>• <strong>Lebanon Infrastructure Safety</strong> - Critical systems and public services</li>
              <li>• <strong>Lebanon Safety & Humanitarian</strong> - Aid distribution and welfare concerns</li>
              <li>• <strong>Lebanon Regional Security</strong> - Geopolitical events and international factors</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
