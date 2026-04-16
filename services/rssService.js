/**
 * RSS Service
 * Fetches and parses RSS/Atom feeds from multiple sources
 * Reused and enhanced from original server-static.js
 */

const RSS_FEEDS = [
  { url: 'https://nna-leb.gov.lb/en/rss', source: 'National News Agency' },
  { url: 'https://www.naharnet.com/tags/lebanon/en/feed.atom', source: 'Naharnet' },
  { url: 'https://www.the961.com/feed/', source: 'The961' },
  { url: 'https://www.newarab.com/rss.xml', source: 'The New Arab' },
  { url: 'https://www.middleeasteye.net/rss', source: 'Middle East Eye' },
  { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC Middle East' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
  { url: 'https://news.google.com/rss/search?q=Lebanon+security+safety&hl=en-LB&gl=LB&ceid=LB:en', source: 'Google News' },
];

function parseRSS(xml, defaultSource) {
  const items = [];
  const tagName = xml.includes('<entry>') ? 'entry' : 'item';
  const matches = xml.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g'));

  for (const match of matches) {
    const block = match[1];
    const title = (block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim();
    const link = (block.match(/<link>(.*?)<\/link>/) || block.match(/<link[^>]*href="([^"]+)"/) || [])[1]?.trim();
    const rawDesc = (block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
      || block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/) || [])[1] || '';
    const desc = rawDesc
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);

    const pubDateStr = (block.match(/<pubDate>(.*?)<\/pubDate>/) || block.match(/<published>(.*?)<\/published>/) || [])[1];
    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

    if (title && link) {
      items.push({
        title,
        link,
        summary: desc,
        source: defaultSource,
        timestamp: pubDate.toISOString(),
        pubDate: pubDate
      });
    }
  }

  return items.slice(0, 5); // Return top 5 items per feed
}

export async function fetchRSSFeeds() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, { timeout: 5000 });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        const items = parseRSS(xml, feed.source);
        return { source: feed.source, items };
      } catch (err) {
        console.warn(`[RSS] Failed to fetch ${feed.source}: ${err.message}`);
        return { source: feed.source, items: [] };
      }
    })
  );

  // Aggregate results
  const feedsData = {};
  const allNews = [];

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      feedsData[result.value.source] = result.value.items;
      allNews.push(...result.value.items);
    }
  });

  return { feedsData, allNews };
}

export function getSeverityFromNews(newsItem) {
  const HIGH_KEYWORDS = ['attack', 'bombing', 'killed', 'explosion', 'war', 'conflict', 'missile', 'casualties'];
  const MEDIUM_KEYWORDS = ['military', 'armed', 'security', 'emergency', 'crisis', 'threat', 'violence'];

  const text = `${newsItem.title} ${newsItem.summary}`.toLowerCase();

  const highMatches = HIGH_KEYWORDS.filter(kw => text.includes(kw)).length;
  const mediumMatches = MEDIUM_KEYWORDS.filter(kw => text.includes(kw)).length;

  if (highMatches > 0) return 'High';
  if (mediumMatches > 1) return 'Medium';
  return 'Low';
}

export function enrichNewsWithSeverity(allNews) {
  return allNews.map(item => ({
    ...item,
    severity: getSeverityFromNews(item)
  }));
}
